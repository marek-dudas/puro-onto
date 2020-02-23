import jsonData from './rules.json';
import RdfController from './RdfController.js';

import $ from 'jquery';
import { throwStatement, logicalExpression, tsThisType } from '@babel/types';
import { isFulfilled, async, allSettled } from 'q';


export default class RuleController {


    constructor() {
        this.rulesJson = JSON.parse(JSON.stringify(jsonData));      
        this.rdfController = new RdfController(); 
        var queryTreePromise = this.rdfController.getFullPath();
        queryTreePromise.then(function(results) {
            this.queryTree = results;   
            console.log(results);        
        }.bind(this));

        //tree bude tady 
        this.ontoModel = [];
        this.index = 0;
        this.ruleIndex = 0;
        this.typeSelection = true;
        this.selectedEl = null;
        this.selectedType =null;
    }
       //label, buttons 
    getButtons = () => {
        var rulesJson = this.rulesJson;
       
       
        var element = this.queryTree[this.index];
        var stop = false;




                
        if ('child' in element) {
            if (element.child.length === 0 && element.connect.length === 0 && element.connectFrom.length === 0)
            {
               
                this.index ++; 
                element = this.queryTree[this.index];
              
            }
            else 
            {
                stop = true;
            }
        } 


        var label  = element.label.value; 
        var puroType = element.type.value.split('#')[1];
        var relation = "";
        var father = ""; 
        var fromOnto = "";
        var linkedTo = 0;
        var question = "";

        // je to pole
        if ('fatherTypeRelation' in element) {
           relation = this.delUri(element.fatherTypeRelation[0]);
        }
        // problém v případě dvou otců.. 

        //bacha na index možná bude jinak
        if ('father' in element){
            fromOnto = this.ontoModel[this.index -1].ontoType;
        }

        if ('connect' in element && element.connect !== null) {
            linkedTo = element.connect.length;
        }

        if (puroType === "BType") {
           question =  rulesJson.questions[0].replace("VAL",label);
        }
        else
        {
      
          // Zeptej se zda reprezentuje nějaký datatyp
          question =  rulesJson.questions[1].replace("VAL",label);
        } 
        
        // ještě dopň vztahy
        //  this.ontoModel.push({uri: element.uri.value, label: label, from: father, ontoType: "", puroType: puroType});
        var result = []; 
        for (let i in rulesJson.rules) {
           // rulesJson.rules[i].puroType ===  puroType && 
            if (rulesJson.rules[i].fromOnto === fromOnto &&
                rulesJson.rules[i].relation === relation &&
                rulesJson.rules[i].linkedTo <= linkedTo  
                ) {      
                // ošetřit když se pravidlo nenajde
                if (rulesJson.rules[i].offer === 0)
                {
                    result = rulesJson.classes.map(function (ruleEl) {
                        return {"name": ruleEl, "uri":null};
                      });
                    return  {"buttons": result,"title": question};
                } 

                else
                {
                   // OPRAV NAMAPUJ!!!!!!!!!!!!!!!!!!!!!!!!
                   for(let val of rulesJson.rules[i].offer) 
                   { 
                       result.push({"name":rulesJson.classes[val], "uri":null}); 
                   }
                   return {"buttons": result, "title": question};
                }
                
            }
        }
    }
    
    // je třeba checkovat ontoModel 
    ruleSelection =  (rule, element, uri) => 
    {
        
        if ("connect" in rule[this.ruleIndex]) 
        {
           
            //pokud type selection zeptej se na typ konkrétního elementu!
            // může mít dva tatky projít cyklem 
            //podívej se jestli už není určen
            if(rule[this.ruleIndex].connect.includes(this.ontoModel[this.index-2].ontoType.toLowerCase()) && this.typeSelection === false && this.selectedEl===null
            && 'father' in element )
            {
                return false; 
            }
            else
            {
                // najdi nebo nabídni typy
                // podívej se jesltli už nebyli zvoleni (asi ne) -> dodělej později
                // možná father type 
                

                if ((this.ruleIndex > 0 && "findRelation" in rule[this.ruleIndex - 1]) || uri )
                {
               
                    let result = rule[this.ruleIndex].connect.map(function (ruleClass) {
                        return {"name": ruleClass, "uri":null};
                    });
                    return Promise.resolve({"buttons": result, "title": rule[this.ruleIndex].question});
                }
                else
                {
            
                    //cyklus!!!!!!!!!!!!!!!!!!! child > 1
                    let i = this.ruleIndex;
                    let result = [{"name": this.delUri(element.child.value), "uri":element.child.value}];  
                    // ještě se to sem musí vrátit aby se určil typ; 
                    this.ruleIndex --;
                    return Promise.resolve({"buttons": result, "title": rule[i].question});
                }



            }
        } 
        // zkontroluj v případě dvojic
        else if ("findRelation" in rule[this.ruleIndex])
        {
           
            if (element.connect.length > 0 || element.connectFrom.length > 0) {
                //podívej se pres relator na objekt ci subtype
                //podivej se na okolní 
                var endBTypes = [];
                var connection = element.connect.concat(element.connectFrom);
                for (let relation of connection)
                {
                   endBTypes.push(this.rdfController.getRelatorBtype(relation));
                }
                return Promise.all(endBTypes).then(function(results) {


                    var buttons = [];    
                    for (var el of results) {
                      if (el[0].father.value === null)
                      {
                        buttons.push({"name":el[0].elementLabel.value, "uri":el[0].element.value});
                      }
                      else
                      {     
                        buttons.push({"name":el[0].fatherLabel.value, "uri":el[0].father.value});
                      }            
                    }
                    //podívej jestli už nemá určený typ.. pokud ano krok +2 
                    console.log("SSS");
                    console.log(buttons);
                    return ({"buttons": buttons, "title":rule[this.ruleIndex].question});
                }.bind(this));
                
            }
            else{
                return false; 
            }
        }
        else if ("create" in rule[this.ruleIndex])
        { 
         
            var returnVal = [{"name": "yes", "uri:": rule[this.ruleIndex].create}, {"name": "no", "uri:": null}]
            return Promise.resolve({"buttons": returnVal, "title":rule[this.ruleIndex.question]}); 
        }
        else if ("relation" in rule[this.ruleIndex])
        {

        }



    }

    nextElement = async (selectedType, selectedUri) =>
    {

        
        // možná jde vylepšit líp
        var rule; 
        // test!!!!!!!!!
        
        if (this.selectedEl === null)
        {
            var element = this.queryTree[this.index]; 
        }
        else 
        {
            for (let node of this.queryTree)
            {
                if(node.uri.value === this.selectedEl)
                {
                    element = node;
                    break;
                }
            }
        }
        
        //tohle jde udělat určitě líp
        if(this.typeSelection === true)
        {
            // tohle je hovno 
            this.addToOntoModel(selectedType); 
            this.typeSelection = false; 
            this.index ++;

        }   
        if(selectedType === "yes" || selectedType === "no")
        {
            if(selectedType === "yes")
            {
              
                this.addToOntoModel(selectedUri, "new");
                selectedUri = null; 
            }
            else
            {
                this.ruleIndex ++;
            }

        }


        if (this.selectedType === null)
        {
            
            rule = this.rulesJson[selectedType.toLowerCase()];
        }
        else
        {
            rule = this.rulesJson[this.selectedType.toLowerCase()];
            
        }

    

        // tohle je mrdla přidej jako elemen 
        if(selectedUri)
        {
           
            this.selectedEl = selectedUri;
        }
        else if (this.selectedEl && this.ruleIndex !== rule.length)
        {
           
            // proto se přidá podruhé 
           // this.addToOntoModel(selectedType, selectedEl)
            this.addToOntoModel(selectedType, this.selectedEl);

           
        }



        // == 2 jen pro devbug
        if ((this.index > 1 && this.ruleIndex < rule.length) || (this.selectedEl !== null && this.ruleIndex === rule.length)) {  
           
            if (this.ruleIndex === 0 && !selectedUri) {
         
                this.selectedType = selectedType;
            }
            if ((this.ruleIndex === rule.length && this.selectedEl !== null))
            {
                this.ruleIndex = 0;            
            }

 
            
            var ruleResult = this.ruleSelection(rule,element, selectedUri);
            //what type is ddc topic 
            //možná by se hodilo posílat selecte
            console.log("je");
            console.log(ruleResult);
            while (ruleResult === false) {
                this.ruleIndex ++;
                ruleResult = this.ruleSelection(rule,element, selectedUri);    
                 
            }
            
    
            return new Promise(resolve => {ruleResult.then(function(results) {
                this.ruleIndex ++;
                resolve(results);
            }.bind(this));
            });

            // return formate rule result
        }
        else {
            
            this.ruleIndex = 0;
            this.selectedType = null;
        
        }
        
       
        if (this.ruleIndex === 0)
        {
        //smazat v return buttons
        this.typeSelection = true;
       
        return new Promise(resolve => {
        // do stromu doplňuje info o relation
            resolve(this.getButtons()); 
        }); 
        }



    }

    addToOntoModel = (selected, elementUri) => 
    {
        
        var element; 

        if(elementUri)
        {
        
            if (elementUri === "new")
            {
                //zapiš to onto Modelu a vypni 
                this.ontoModel.push({uri: "", label: "NAME", from: "s", to: "s", ontoType: selected, puroType: null});

                return true; 
            }
            else
            {
                for (let node of this.queryTree)
                {
                    if(node.uri.value === elementUri)
                    {
                        element = node;
                        break; 
                    }
                }
            }
           
        }
        else{
            element = this.queryTree[this.index];
        }

        var label  = element.label.value; 
        var puroType = element.type.value.split('#')[1];
        var relation = "";
        var father = ""; 
        var fromOnto = "";
        var linkedTo = 0;
        var question = "";
        if ('relation' in element) {
           relation = element.relation.value.split('#')[1];
        }
        // problém v případě dvou otců.. 
        if ('father' in element) {
            father = element.father[0];
        }
        if ('connect' in element && element.connect !== [] && element.connect !== null) {
            linkedTo = element.connect.length;
        }

        //bacha na index možná bude jinak
        if (this.index > 1){
            fromOnto = this.ontoModel[this.index -1].ontoType;
        }
        // ještě dopň vztahy
        this.ontoModel.push({uri: element.uri.value, label: label, from: father, ontoType: selected, puroType: puroType});
        console.log("hééééééééééééééé");
        console.log(this.ontoModel);
        return true; 
    }

    delUri = (uri) => 
    {
        return uri.split('#')[1];
    }

    l = (m2) =>
    {
        console.log("CECKKKKKKKKKKKKKKKKKKKKK");
        console.log(m2);
    } 
        
}




