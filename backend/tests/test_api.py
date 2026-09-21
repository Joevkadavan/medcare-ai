import asyncio
import copy
import sys
import time
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from main import app
from config import get_settings
from models import ChatRequest
from services import ai_service, symptom_service
from services.emergency_service import detect_emergency
import store

A = dict(symptoms=['Fatigue'], duration='1-2 days', severity='Mild', notes='')

class ContractTests(unittest.TestCase):
    def setUp(self):
        store._SESSIONS.clear()
        self.client = TestClient(app)

    def test_meta(self):
        self.assertEqual(self.client.get('/').status_code, 200)
        self.assertEqual(self.client.get('/health').json()['rag_status'], 'RAG_READY')

    def test_mild(self):
        r = self.client.post('/assess', json=A)
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.json()['emergency'])
        self.assertEqual(r.json()['risk_level'], 'LOW')
        self.assertTrue(r.json()['sources'])

    def test_emergency(self):
        a = dict(A, symptoms=['Chest pain', 'Breathing difficulty'], severity='Severe')
        r = self.client.post('/chat', json={'assessment': a}).json()
        self.assertTrue(r['emergency'])
        self.assertTrue(r['complete'])
        self.assertEqual(r['options'], [])
        self.assertEqual(r['risk_level'], 'EMERGENCY')

    def test_validation(self):
        cases = [{}, dict(A, symptoms=[]), dict(A, symptoms=['  ']), dict(A, symptoms=['x']*13),
                 dict(A, notes='x'*2001), dict(A, severity='unknown'), dict(A, duration='tomorrow'),
                 dict(A, symptoms=['x'*121]), dict(A, additional_symptoms=['None of these','Cough'])]
        for a in cases:
            with self.subTest(a=list(a)):
                self.assertEqual(self.client.post('/assess', json=a).status_code,422)

    def test_history_limits_and_roles(self):
        for history in [[{'role':'system','content':'x'}], [{'role':'user','content':' '}],
                        [{'role':'user','content':'x'*2001}], [{'role':'user','content':'x'}]*41]:
            self.assertEqual(self.client.post('/chat',json={'assessment':A,'message':'x','conversation':history}).status_code,422)
        self.assertEqual(self.client.post('/chat',json={'assessment':A,'message':' '*3,'conversation':[{'role':'assistant','content':'Question?'}]}).status_code,422)

    def test_no_sensitive_validation_echo(self):
        secret='private narrative '*200
        r=self.client.post('/assess',json=dict(A,notes=secret))
        self.assertNotIn('private narrative',r.text)

    def test_demo_end_to_end(self):
        history=[]
        credentials={}
        for index in range(5):
            r=self.client.post('/chat',json={'assessment':A,'message':'' if index==0 else 'About the same',
                                           'conversation':history,**credentials})
            self.assertEqual(r.status_code,200,r.text)
            data=r.json()
            credentials={k:data[k] for k in ['session_id','session_token']}
            if index: history.append({'role':'user','content':'About the same'})
            history.append({'role':'assistant','content':data['message']})
            if data['complete']: break
        self.assertTrue(data['complete'])
        result=self.client.post('/consultation',json={'assessment':A,'conversation':history,**credentials})
        self.assertEqual(result.status_code,200,result.text)
        self.assertFalse(result.json()['emergency'])
        self.assertGreater(len(result.json()['follow_up_answers']),0)
        self.assertEqual(self.client.post('/reset',json=credentials).status_code,200)
        self.assertEqual(store.count(),0)
        self.assertEqual(self.client.post('/chat',json={'assessment':A,**credentials}).status_code,401)

    def test_id_is_not_authorization(self):
        data=self.client.post('/chat',json={'assessment':A}).json()
        self.assertEqual(self.client.post('/consultation',json={'assessment':A,'session_id':data['session_id']}).status_code,401)
        self.assertEqual(self.client.post('/reset',json={'session_id':data['session_id']}).status_code,401)
        self.assertEqual(store.count(),1)

    def test_followup_emergency_and_latch(self):
        data=self.client.post('/chat',json={'assessment':A,'message':'I cannot breathe'}).json()
        credentials={k:data[k] for k in ['session_id','session_token']}
        result=self.client.post('/consultation',json={'assessment':A,**credentials}).json()
        self.assertTrue(result['emergency'])
        self.assertIn('now',result['next_steps'][0])

    def test_summary_screens_user_only(self):
        for role, emergency in [('user', True),('assistant', False)]:
            r=self.client.post('/consultation',json={'assessment':A,'conversation':[{'role':role,'content':'severe chest pain'}]})
            self.assertEqual(r.json()['emergency'],emergency)

    def test_expiry_and_capacity(self):
        sid,token=store.resolve()
        store._SESSIONS[sid]['updated']=time.monotonic()-store.SESSION_TTL_SECONDS-1
        self.assertEqual(store.count(),0)
        with patch.object(store,'MAX_SESSIONS',1):
            store.resolve()
            self.assertEqual(self.client.post('/chat',json={'assessment':A}).status_code,503)

    def test_cors(self):
        good=self.client.options('/chat',headers={'Origin':'http://localhost:3000','Access-Control-Request-Method':'POST'})
        self.assertEqual(good.status_code,200)
        self.assertEqual(good.headers['access-control-allow-origin'],'http://localhost:3000')
        bad=self.client.options('/chat',headers={'Origin':'https://untrusted.example','Access-Control-Request-Method':'POST'})
        self.assertNotIn('access-control-allow-origin',bad.headers)

    def test_rag_ready_not_active(self):
        settings=get_settings()
        with patch.object(settings,'rag_enabled',True):
            self.assertEqual(self.client.get('/health').json()['rag_status'],'RAG_READY')
            self.assertEqual(self.client.post('/assess',json=A).json()['rag_status'],'RAG_ACTIVE')

class EmergencyTests(unittest.TestCase):
    def test_variants(self):
        for text in ['severe chest pain','I cannot breathe',"I can’t breathe",'difficulty breathing',
                     'unconscious','severe bleeding','seizure','face is drooping','slurred speech',
                     'sudden weakness on one side','the worst headache I have had']:
            with self.subTest(text=text): self.assertTrue(detect_emergency(text=text)[0])
    def test_false_positives(self):
        for text in ['no difficulty breathing','my clothes are fitting poorly','stroke of luck','seizurefree','no severe bleeding']:
            with self.subTest(text=text): self.assertFalse(detect_emergency(text=text)[0])
    def test_mixed_positive(self):
        self.assertTrue(detect_emergency(text='no severe bleeding but I cannot breathe')[0])

class ProviderTests(unittest.TestCase):
    def test_failure_and_malformed(self):
        request=ChatRequest(assessment=A)
        analysis=symptom_service.analyse(request.assessment.model_dump())
        analysis['assessment']=request.assessment.model_dump()
        settings=get_settings()
        for response in ['not json','{"question_id":99}','{"question_id":0,"diagnosis":"bad"}', '{"question_id":true}']:
            with patch.object(settings,'openai_api_key','test'), patch.object(ai_service,'_call_openai',AsyncMock(return_value=response)):
                result=asyncio.run(ai_service.generate_reply(request,analysis,[]))
                self.assertEqual(result[-1],'mock')
        with patch.object(settings,'openai_api_key','test'), patch.object(ai_service,'_call_openai',AsyncMock(side_effect=TimeoutError)):
            self.assertEqual(asyncio.run(ai_service.generate_reply(request,analysis,[]))[-1],'mock')
    def test_emergency_never_calls_provider(self):
        request=ChatRequest(assessment=dict(A,symptoms=['Chest pain']))
        analysis=symptom_service.analyse(request.assessment.model_dump())
        with patch.object(get_settings(),'openai_api_key','test'), patch.object(ai_service,'_call_openai',AsyncMock()) as provider:
            result=asyncio.run(ai_service.generate_reply(request,analysis,[]))
            provider.assert_not_called()
            self.assertTrue(result[3])

if __name__ == '__main__': unittest.main()

class RagTests(unittest.TestCase):
    def setUp(self):
        store._SESSIONS.clear()
        self.client = TestClient(app)
    def ask(self, message, **kwargs):
        return self.client.post('/chat',json={'intent':'question','message':message,**kwargs})
    def test_grounded_question(self):
        data=self.ask('How long can a cough last?').json()
        self.assertEqual(data['rag_status'],'RAG_ACTIVE')
        self.assertEqual(data['answer_mode'],'retrieval')
        self.assertIn('three',data['message'])
        for i,source in enumerate(data['sources'],1):
            self.assertIn(source['snippet'] + f' [{i}]',data['message'])
            self.assertTrue(source['url'].startswith('https://www.nhs.uk/'))
            self.assertGreater(source['score'],0)
    def test_uncovered_and_prescription(self):
        for question in ['How does quantum computing work?','What dose should I take for fever?','How is diabetes treated?']:
            data=self.ask(question).json()
            self.assertEqual(data['answer_mode'],'abstain')
            self.assertFalse(data['sources'])
    def test_disabled_rag(self):
        with patch.object(get_settings(),'rag_enabled',False):
            data=self.ask('What is fever?').json()
            self.assertEqual(data['rag_status'],'RAG_DISABLED')
            self.assertEqual(data['sources'],[])
    def test_emergency_overrides_retrieval(self):
        data=self.ask('I cannot breathe, what should I do?').json()
        self.assertTrue(data['emergency'])
        self.assertEqual(data['answer_mode'],'emergency')
        self.assertFalse(data['allow_free_text'])
        self.assertFalse(data['sources'])
    def test_blank_question(self):
        self.assertEqual(self.ask('   ').status_code,422)
    def test_source_failure_abstains(self):
        with patch('rag.retriever.all_documents',return_value=[]):
            self.assertEqual(self.ask('What is fever?').json()['answer_mode'],'abstain')
    def test_followup_context(self):
        data=self.ask('How long can it last?',conversation=[{'role':'user','content':'I have a cough'}]).json()
        self.assertTrue(data['sources'])
        self.assertTrue(all(s['id'].startswith('cough') for s in data['sources']))

class TopicSwitchTests(unittest.TestCase):
    def test_explicit_new_topic_does_not_inherit_old_topic(self):
        from rag.qa import answer
        from models import ConversationTurn
        _, docs = answer('When should I seek care for fatigue?', [ConversationTurn(role='user',content='I have a cough')])
        self.assertTrue(docs)
        self.assertTrue(all(d['id'].startswith('fatigue') for d in docs))
