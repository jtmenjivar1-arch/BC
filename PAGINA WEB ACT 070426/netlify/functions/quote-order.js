'use strict';
const {quote}=require('./lib/store');
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return {statusCode:405,body:'Method not allowed'};
 try {const p=JSON.parse(event.body||'{}');return {statusCode:200,headers:{'content-type':'application/json'},body:JSON.stringify(await quote(p.items))};}
 catch(e){return {statusCode:400,body:JSON.stringify({error:e.message})};}
};
