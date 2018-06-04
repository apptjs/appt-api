import express from "express";

class ApptApi {
   constructor(){
      this.express = express;
      this.instance = this.express();
   }

   getInstance(){
      return this.instance;
   }

   getExpress(){
      return this.express;
   }
}

export default new ApptApi();
