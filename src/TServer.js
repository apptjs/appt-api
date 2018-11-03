import { apptRouterSystem } from './TRouter';
import apptApi from './appt.api';

export default function TServer(main, options = null){
    return {
        target: ApptServer,
        args: {
            main: main,
            options: options
        }
    }
}

class ApptServer{
    constructor(extenderParams, Target){
        this.api = apptApi.getInstance();
        this.express = apptApi.getExpress();

        this.defaultConfig = {
            port: extenderParams && extenderParams.main || 3000,
            statics: [],
            bodyParser: {
                json: {
                    limit: '50mb', 
                    type: 'application/json'
                }, 
                urlencoded: {
                    limit: '50mb', 
                    extended: true
                }
            },
            cors: [{
                route: "/*",
                header: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Authorization, Content-Type, Origin, Accept, X-Requested-With, Origin, Cache-Control, X-File-Name",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS, DELETE"
                }
            }]
        }; 
        
        this.customConfig = this.defaultConfig;

        this.setStatics(extenderParams && extenderParams.options && extenderParams.options.statics);
        this.setBodyParser(extenderParams && extenderParams.options && extenderParams.options.bodyParser);
        this.setCors(extenderParams && extenderParams.options && extenderParams.options.cors);

        return this.exec(Target)
   }

   setStatics(staticsConfig) {
      this.customConfig.statics = staticsConfig || this.defaultConfig.statics;

      this.customConfig.statics.forEach(opt => {      
         this.api.use(opt.route, this.express.static(opt.path));
      })
   }

   setBodyParser(bodyParser) {
      this.customConfig.bodyParser = bodyParser || this.defaultConfig.bodyParser;

      const bp = require('body-parser');
  
      this.api.use(bp.json(this.customConfig.bodyParser.json));
      this.api.use(bp.urlencoded(this.customConfig.bodyParser.urlencoded));
   }

   setCors(cors) {
      this.customConfig.cors = cors || this.defaultConfig.cors;

      this.customConfig.cors.forEach(c => {
         this.api.all(c.route,
         (req, res, next) => {
           Object.keys(c.header).forEach(key => {
             res.header(key, c.header[key]);
           });
           
           next();
         });
       });
   }

   loadRoutes(){
        Object.keys(apptRouterSystem.ready)
            .forEach(routerName => {
                apptRouterSystem.ready[routerName]
                    .forEach(routerEvent => routerEvent.emit('complete'));
            });
   }

   exec(Target) {
        this.loadRoutes();

        return new Promise((resolve, reject) => {        
            this.api.listen(this.customConfig.port, 
                (err) => {
                    if(err) reject(err);            
                    resolve(new Target({
                        instance: this.api,
                        config: this.customConfig
                    }));
                });
        });
   }
}