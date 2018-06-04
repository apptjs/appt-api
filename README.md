# @appt/api
This package brings and wraps to the Appt's ecosystem all the essential packages, middlewares and configurations to built a ready-to-go REST Api. 
We assume you got here after seeing the [Appt's Main Page](https://github.com/brab0/appt) . If you don't, **we strongly recommend** you to step back an take a 5 minutes reading to get used with some key concepts we're going to apply here.


## Install
    $ npm install @appt/api --save


## Third-Party
We don't want re-invent the wheel! Thanks to these amazing packages out there we can go straight to the point. 
There is some of those we're using at this project:
- [`body-parser`](https://www.npmjs.com/package/body-parser) to handle the request parameters;
- [express](https://www.npmjs.com/package/express) to run api's `Server`, `Routes`, `Statics`, `cross-domain(CORS)` and so on...
- [express-jwt](https://www.npmjs.com/package/express-jwt) to handle the access control;  
 
 
## Resources
The `@appt/api` exports some resources which can be imported as seen below:
```javascript
import {
	TServer,
	TRouter,
	api
} from '@appt/api';

import {
	Get,
	Post,
	Put,
	Delete,
	Patch,
	...
} from '@appt/api/router';
```

### TServer
This is a *special-type extender* we can use to transform a component into an **express server**. There are many default configurations (as you can see at the example below) which, without them, you probably could not do much. That brings us one of the Appt's main goals: *allow you to start a project with minimum effort*. Of course you can override each one of them.

```javascript
import { ApptComponent } from '@appt/core';
import { TServer } from '@appt/api';


/* These are the default configuration you can override */
const config = {
	address: {
		host : "http://localhost",
		port : 3000
	},
	statics: [{
		route: '/',
		path: '/'
	}],
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

@ApptComponent({
	extend: {
		type: TServer,
		config: config
	}
})
export class ApiServer{
	constructor(config){
		// the especial-type externder TServer inject all the server configurations
		console.log(`Server running at ${config.address.host}:${config.address.port}`)
	}
}
```

### TRouter
Another *special-type extender*. Here, we are specifically handling the component to become an express *basepath router*.
**We love express**, but one of the things we miss, it's the capability of easily segment their routes into many different components.
Since one of our main concerns is *allow you to have total control on what the architecture you decide to take to your project*, this extender make it possible by assembling child component paths through its `use` param:
```javascript
/* api.router.js */

import { ApptComponent } from '@appt/core';
import { TRouter } from '@appt/api';

@ApptComponent({
	extend: {
		type: TRouter,
		use: ['PrivateRouter', 'PublicRouter'],
		config: {
			path: '/api'
		}
	}
})
export class ApiRouter{}
```
```javascript
/* public.router.js */

import { ApptComponent } from '@appt/core';
import { TRouter } from '@appt/api';

@ApptComponent({
	extend: {
		type: TRouter,
		config: {
			path: '/public'
		}
	}
})
export class PublicRouter{}
```
```javascript
/* private.router.js */
@ApptComponent({
	extend: {
		type: TRouter,
		config: {
			path: '/private',
			auth: {
				secret: '231edfrw21g34',
				ignore: ['favicon.ico', /\/back-/\/]
			}
		}
	}
})
export class PrivateRouter{}

```
A few things are going on here. The `use: ['PrivateRouter', 'PublicRouter']` will tell Appt to look if such components are TRouters. If so, they're gonna assemble their `paths` and form a basepath. For those who have experienced express, internally the result of the example above will be something like:
```javascript
import express from  'express';
const { Router } = express;

const app = express();
const router = Router();
    
app.use('/api/public', router);
app.use('/api/private', router);
```
Another thing to pay attention is the `auth` property:
```javascript
...
config: {
	path: '/private',
	auth: {
		secret: '231edfrw21g34',
		ignore: ['favicon.ico', /\/back-/\/]
	}
}
...
```
We are using `express-jwt` to control our router access. So, if you want to protect some path, just define the JWT secret to decrypt the *Bearer Authorization token* passed on the request header and, if you want some exception rule to ignore a path, just use the respective property. 
### Router Methods
Appt's router methods are essentially **express router methods with sugar**. So first, we export every method express also does on a Capitalized pattern. Second, makes sense for us to maintain an semantic and coherent pattern, since many things here are using decorator and annotation syntax. Lets improve the *PrivateRouter* component a little: 
```javascript
/* private.router.js */

import { TRouter } from '@appt/api';
import { Get, Post } from '@appt/api/router';

@ApptComponent({
	extend: {
		type: TRouter,
		config: {
			path: '/private',
			auth: {
				secret: '231edfrw21g34',
				ignore: ['favicon.ico', /\/back-/\/]
			}
		}
	},
	inject: ['MiddlewaresComponent']
})
export class PrivateRouter{
	constructor(myMiddleware){
		this.middleware = myMiddleware;
	}
	
	@Get('/')
	getAll(req, res, next){
		res.status(200).send('Take everything!')
	}

	@Get('/:id')
	getById(req, res, next){
		res.status(200).send(`We're gonna search by: ${req.params.id}`)
	}

	@Post('/:id', this.middleware.doSomethingFirst)
	getById(req, res, next){
		res.status(200).send(req.body)		
	}
}
```
Pretty much express in a sugar syntax, right? 

### api
This is an exportation of express *as-it-is*. You might want decide to do something with it and, **why not?** From it, you can access an express instance, which Appt is using or even the 'class' to handle whatever you want.
```javascript
import { ApptComponent } from '@appt/core';
import { api } from '@appt/api';

@ApptComponent()
export class SomeComponent{
	printExpressApiInstance(){	
		console.log(this.instance);
	}
	
	printExpress(){	
		console.log(this.express);
	}
}
```

## Compatibility
**We're using ES6 features!** Which means you gonna need to compile your code to work with current versions of **NodeJs**. Thankfully, there's a lot of tools out there doing that, such as [babel](https://babeljs.io/).
You might also want to work with **TypeScript**. If you do, check the *experimental decorators support* option to start coding.


## That's all folks!
If you have any suggestion or want to contribute somehow, let me know!


## License
```

MIT License

  

Copyright (c) 2017 Rodrigo Brabo

  

Permission is hereby granted, free of charge, to any person obtaining a copy

of this software and associated documentation files (the "Software"), to deal

in the Software without restriction, including without limitation the rights

to use, copy, modify, merge, publish, distribute, sublicense, and/or sell

copies of the Software, and to permit persons to whom the Software is

furnished to do so, subject to the following conditions:

  

The above copyright notice and this permission notice shall be included in all

copies or substantial portions of the Software.

  

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR

IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,

FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE

AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER

LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,

OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE

SOFTWARE.

```
