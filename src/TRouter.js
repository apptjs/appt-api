import jwt from "express-jwt";
import EventEmitter from "events";

import { apptEcosystem } from '@appt/core';
import { Router } from 'express';
import apptApi from './appt.api';

class ApptRoute {
  constructor(extend, target){    
    this.path = extend.config.path;
    this.auth = extend.config.auth;    
    this.components = extend.use;
    this.target = target;
  }
}

class RouterChain {
  constructor(){
    this.list = [];
  }

  add(extend, target){    
    if(!this.list.some(item => item.target === target)){
      const apptRoute = new ApptRoute(extend, target);      
      this.list.push(apptRoute);
    }    
  }

  getByTarget(target){
    return new Promise((resolve, reject) => {      
      const route = this.list.find(route => target === route.target);      
      
      this.buildChain(route, completePath => {        
        resolve(completePath)
      });
    })
  }

  buildChain(route, cb, routes = []){    
    if(route){
      routes.unshift(route);
      
      const parent = this.getParentRoute(route.target);
      
      return this.buildChain(parent, cb, routes);
    } else {
      cb(routes)
    }
  }

  getRoute(route){
    return this.list.find(item => item.target === route);
  }

  getParentRoute(route){    
    return this.list.find(item => {            
      return item.components && item.components.length > 0 && item.components.some(component => {          
        return component === route
      })
    });
  }
}

class ApptRouterSystem {
  constructor(){    
    this.api = apptApi.getInstance();
    this.routerChain = new RouterChain();
    this.ready = [];
  }

  isReady(route){
    return new Promise(resolve => {
      
      if(this.ready[route])
        this.ready[route].push(new EventEmitter());
      else 
        this.ready[route] = [new EventEmitter()];
            
      return this.ready[route][this.ready[route].length - 1].on('complete', () => {        
        return this.routerChain.getByTarget(route)
          .then(routerChain => this.setAuth(routerChain))
          .then(routerChain => this.useRouterPath(routerChain))
          .then(router => {
            resolve(router)
          });
      })
    })    
  }

  setAuth(routerChain){    
    let indexAuth = routerChain
      .map(router => typeof(router.auth))
        .indexOf('object');
    
    if(indexAuth > -1){
      const protectedRouter = routerChain.slice(0, parseInt(indexAuth + 1));
      
      if(protectedRouter && protectedRouter.length > 0){        
        this.api.use(this.getRouterPath(protectedRouter), jwt({
            secret: protectedRouter[indexAuth].auth.secret
          }).unless({
            path: protectedRouter[indexAuth].auth.ignore ? protectedRouter[indexAuth].auth.ignore : null
          }));

        this.api.use((err, req, res, next) => {
          if (err.name === 'UnauthorizedError') {
            res.status(401).send('You shall not pass!!! Your token was not found or it\'s invalid.');
          }
        });
      }
    }    

    return routerChain;
  }

  getRouterPath(routerChain){
    return routerChain.map(target => target.path).join('');
  }

  useRouterPath(routerChain){
    const router = Router();

    this.api.use(this.getRouterPath(routerChain), router);
  
    return router;
  }

  addBasePath(extend, target){    
    return new Promise(resolve => {          
      
      this.routerChain.add(extend, target);      
      
      resolve();
    })    
  }
}

export const apptRouterSystem = new ApptRouterSystem();

export default class TRouter {
  constructor(targetName){
    this.targetName = '';
  }

  exec(extend, Target, injectables) {
    this.targetName = Target.name;

    return new Promise(resolve => {
      if(extend.use){
        return this.normalizeComponents(extend.use)
          .then(components => {
            extend.use = components;
            
            resolve(extend);
          });
      } else resolve(extend);      
    })
    .then(extend => apptRouterSystem.addBasePath(extend, Target.name))
    .then(res => {        
      if(injectables && injectables.length > 0){
        return new Target(...injectables)
      } else {
        return new Target()
      }
    })
  }

  normalizeComponents(components){     
    return new Promise(resolve => {
      if(!(components instanceof Array)){
        components = [components]
      }
      
      const arrComponents = components.map(component => {
        if(typeof component === 'string'){
          // only for component's name validation purposes
          apptEcosystem.getEntity(component, this.targetName);
          
          return component;
        }          
        else {          
          const apptPromise = new component();          
          
          return apptPromise.then(comp => comp.constructor.name);
        }
      });

      resolve(Promise.all(arrComponents))
    });
  }
}