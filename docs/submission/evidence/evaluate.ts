import fs from 'node:fs';
import { z } from 'zod';
import { callStructured, ChatMessage } from './lib/ai/client';
import { GENERATE_SYSTEM, describeSchema } from './lib/ai/prompts';
import { AppSpecSchema } from './lib/apps/spec';
import { validateSpec } from './lib/apps/validate';
import { extractSchema } from './lib/google/schema';
import { fixtures } from './tests/fixtures/sheets';

const models=['zai-org/GLM-5.3','zai-org/GLM-5.3-Flash'];
const requests = [
 ['budget','Let each cost-center owner see only their own budget line, edit Q1, Q2, Q3, Q4 and Justification, and see FY2026 Actual as read-only. Do not let unmatched users choose another row.'],
 ['tasks','Show each signed-in assignee all of their tasks, with Due Date and Priority visible. Let them change only Status and Notes.'],
 ['inventory','Create a read-only inventory table sorted by Quantity ascending, with a total Quantity metric.'],
 ['rsvp','Create an RSVP form for Name, Attending?, Dietary needs and Plus one. Use the signed-in email automatically.'],
 ['headcount','Let each manager see only their reports and edit only Onboarding Complete. Do not show Salary Band.'],
] as const;
const outSchema=z.object({spec:AppSpecSchema,summary:z.string().describe('One or two sentences to the builder')});
const rows:any[]=[];
fs.writeFileSync('protocol.json',JSON.stringify({date:new Date().toISOString(),models,reasoningEffort:'high',repetitions:1,requests,maximumAttempts:2,latency:'End-to-end elapsed time, including validation and retries; first request for each model included. Server warm state unknown.',quality:'First-attempt and final spec validation automated. Workflow correctness reviewed separately against EVALUATION.md acceptance rules.',source:JSON.parse(fs.readFileSync('source.json','utf8'))},null,2));

async function main(){
 for(let i=0;i<requests.length;i++){
  const [fixtureName,prompt]=requests[i];
  const fixture=fixtures[fixtureName];
  const schema=extractSchema(fixture.values,fixture.sheetTitle);
  const order=i%2===0?models:[...models].reverse();
  for(const model of order){
   const messages:ChatMessage[]=[{role:'user',content:`Organization: Acme\n\n${describeSchema({title:fixture.title,schema})}\n\nThe builder asks for: ${prompt}`}];
   const row:any={model,fixture:fixtureName,prompt,started:new Date().toISOString(),attempts:[]};
   const begin=Date.now();
   for(let attempt=1;attempt<=2;attempt++){
    try {
     const result=await callStructured({model,system:GENERATE_SYSTEM,messages,schema:outSchema,schemaName:'app_spec',reasoningEffort:'high'});
     const validation=validateSpec(result.data.spec,schema);
     row.attempts.push({attempt,requestMs:result.ms,usage:result.usage,responseFormat:result.responseFormat,valid:validation.ok,errors:validation.ok?[]:validation.errors,output:result.data});
     if(validation.ok){row.finalValid=true;row.spec=validation.spec;break;}
     messages.push({role:'assistant',content:JSON.stringify(result.data)},{role:'user',content:`The spec failed validation:\n- ${validation.errors.join('\n- ')}\nFix these and return the full spec.`});
    } catch(err:any) {
     const msg=String(err?.message??err);
     row.attempts.push({attempt,valid:false,error:msg});
     if(!msg.startsWith('Model returned invalid JSON'))break;
     messages.push({role:'user',content:`The spec failed validation:\n- ${msg}\nFix these and return the full spec.`});
    }
   }
   row.finalValid??=false;
   row.elapsedMs=Date.now()-begin;
   row.firstAttemptValid=row.attempts[0]?.valid===true;
   rows.push(row);
   fs.writeFileSync('results.json',JSON.stringify(rows,null,2));
   console.log(JSON.stringify({fixture:fixtureName,model,elapsedMs:row.elapsedMs,firstAttemptValid:row.firstAttemptValid,finalValid:row.finalValid,attempts:row.attempts.length}));
  }
 }
}
main().catch(err=>{console.error(String(err?.message??err));process.exitCode=1;});
