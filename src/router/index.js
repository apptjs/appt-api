import { apptEcosystem } from '@appt/core'
import { apptRouterSystem } from '../TRouter';

function getRouteParams(args, main){
   const arrArgs = Array.from(args);
   const path = arrArgs.shift();

   return {
      path: path, 
      middlewares: arrArgs.concat(main)
   };
}

function decoratorFactory(args, cb){
   return function(Target, propertyKey, descriptor) {
      return apptRouterSystem.isReady(Target.constructor.name)
            .then((expRouter) => {
                  const Entity = apptEcosystem.getEntity(Target.constructor.name);
                  const promiseEntity = new Entity();
                  
                  return promiseEntity.then(target => {
                        const { path, middlewares } = getRouteParams(args, descriptor.value.bind(target));

                        return cb(path, middlewares, expRouter);
                  });
            });
      }
}

export function Checkout(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.checkout(path, middlewares)
   })
}

export function Copy(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.copy(path, middlewares);
   });
}

export function Head(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.head(path, middlewares);
   });
}

export function Lock(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.lock(path, middlewares);
   });
}

export function Merge(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.merge(path, middlewares);
   });
}

export function MKactivity(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.mkactivity(path, middlewares);
   });
}

export function MKcol(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.mkcol(path, middlewares);
   });
}

export function Move(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.move(path, middlewares);
   });
}

export function Notify(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.notify(path, middlewares);
   });
}

export function Patch(...args){   
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.patch(path, middlewares);
   });
}

export function Purge(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.purge(path, middlewares);
   });
}

export function Report(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.report(path, middlewares);
   });
}

export function Search(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.search(path, middlewares);
   });
}

export function Subscribe(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.subscribe(path, middlewares);
   });
}

export function Trace(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.trace(path, middlewares);
   });
}

export function Unlock(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.unlock(path, middlewares);
   });
}

export function Unsubscribe(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.unsubscribe(path, middlewares);
   });
}

export function Post(...args){        
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.post(path, middlewares);
   });
}

export function Get(...args){      
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.get(path, middlewares)
   });
}

export function Put(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.put(path, middlewares);
   });
}

export function Delete(...args){
   return decoratorFactory(arguments, function(path, middlewares, router){
      return router.delete(path, middlewares);
   });
}