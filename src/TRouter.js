import jwt from "express-jwt";
import EventEmitter from "events";

import { apptEcossystem } from '@appt/core';
import { Router } from 'express';
import apptApi from './appt.api';

class ApptRoute {
  constructor(route, use, target){    
    this.path = route.path;
    this.auth = route.auth;
    this.components = use;
    this.target = target;
  }
}

class RouterChain {
  constructor(){
    this.list = [];
  }

  add(route, use, target){    
    if(!this.list.some(item => item.target === target)){
      const apptRoute = new ApptRoute(route, use, target);
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
      return cb(routes)
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

  addBasePath(route, use, target){    
    return new Promise(resolve => {          
      
      this.routerChain.add(route, use, target);      
      
      resolve();
    })    
  }
}

export const apptRouterSystem = new ApptRouterSystem();

export default class TRouter {
  constructor(){}

  exec(base, use, Target, injectables) {    
    return apptRouterSystem.addBasePath(base, use, Target.name)
      .then(res => {        
        if(injectables && injectables.length > 0){
          return new Target(...injectables)
        } else {
          return new Target()
        }
      })
  }
}