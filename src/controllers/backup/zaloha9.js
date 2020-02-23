import jsonData from './rules.json';
import RdfController from './RdfController.js';
import $ from 'jquery';



export default class RuleController {


    constructor() {
        this.rulesJson = JSON.parse(JSON.stringify(jsonData));      
        this.rdfController = new RdfController(); 
        var queryTreePromise = this.rdfController.getFullPath();
        queryTreePromise.then(function(results) {
            this.queryTree = results;   
            console.log(results);        
        }.bind(this));
 
        this.ontoModel = [];
        this.index = 0;
        this.ruleIndex = 0;
        this.typeSelection = true;
        this.selectedEl = null;
        this.selectedType =null;
        this.lastSelectedType = null;
        this.selectedElements = [];
    }
    
    // je třeba checkovat ontoModel 
    ruleSelection =  (rule, element, uri) => 
    {
        
        if ("connect" in rule[this.ruleIndex]) 
        {
            
            //pokud type selection zeptej se na typ konkrétního elementu!
            // může mít dva tatky projít cyklem 
            //podívej se jestli už není určen
            //check element father 
            //fathers type 

            var fatherOntoType = []; 
            for(let father of element.father)
            {      
                for (let node of this.ontoModel)
                {
                    if (father === node.uri)
                    {
                       fatherOntoType.push(node.ontoType); 
                    }
                }
            }
     
            
            // tohle je blbě je zle -> ochcávka
            if(rule[this.ruleIndex].connect.some(r=> fatherOntoType.includes(r)) && this.delUri(element.type.value)!=="BObject")
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
                        return {"name": ruleClass, "uri":null, "origin":"selected"};
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
                        buttons.push({"name":el[0].elementLabel.value, "uri":el[0].element.value, "relName":el[0].relationName});
                      }
                      else
                      {     
                        buttons.push({"name":el[0].fatherLabel.value, "uri":el[0].father.value,"relName":el[0].relationName});
                      }            
                    }
                    //podívej jestli už nemá určený typ.. pokud ano krok +2 
                    return ({"buttons": buttons, "title":rule[this.ruleIndex].question});
                }.bind(this));
                
            }
            else{
                return false; 
            }
        }
        else if ("create" in rule[this.ruleIndex])
        { 
            
            var returnVal = [{"name": "yes", "uri": null, "createdClass": rule[this.ruleIndex].create}, {"name": "no", "uri": null}]
            return Promise.resolve({"buttons": returnVal, "title":rule[this.ruleIndex.question]}); 
        }
        else if ("relation" in rule[this.ruleIndex])
        {

        }
        else if ("end" in rule[this.ruleIndex])
        {
        
            return true; 
           // return Promise.resolve({"buttons": result, "title": });
        }



    }

    getDefault = () =>
    {
         var result;
        
         result = this.rulesJson.classes.map(function (ruleEl) {
            return {"name": ruleEl, "uri":null};
          });
         return  {"buttons": result,"title": this.queryTree[this.index].label.value};   

    }

    commonRuleSelection = (element) => 
    {
        var result = [];
        var fatherOnto = [];
        var connection = 0;
        if (element.connect !== null)
        {
            connection = element.connect.length + element.connectFrom.length; 
        }
   
        var fatherPuro =  this.delUri(element.fatherType);
        var childPuro =   this.delUri(element.childType);
        
        for (let node of this.ontoModel)
        {
            if (element.father.includes(node.uri)) {
                fatherOnto.push(node.ontoType);
            }
        }
        
        for (var rule of this.rulesJson.commonRules)
        {
            
            if ((fatherOnto.includes(rule.fatherOnto) || (fatherOnto.length === 0 && rule.fatherOnto === "")) &&
                (fatherPuro.includes(rule.fatherPuro) || (fatherPuro.length === 0 && rule.fatherPuro === "")) &&
                childPuro.includes(rule.childPuro) || childPuro === rule.childPuro &&
                rule.hasRelation <= connection
                )
            {
                for(let val of rule.offer) 
                { 
                    result.push({"name":this.rulesJson.classes[val], "uri":null, "origin":"list"}); 
                }
                return {"buttons": result, "title": element.label.value};
            }
        }
    }

    // addToOntotype blbě je FROM !!!!
    nextElement = async (selectedType, selectedUri, createdClass, elementOrigin) =>
    {  
        //jedeme dále vytvoř pole do kterýho se vrať a kontroluj úplnost 

        // [uri: ]

        var rule; 
        var element;
        var ruleResult; 
        
        //Uloží do meta modelu po zvolení parametru
        //posouvat index pouze v případě, že se element načetl z query tree  
        if (this.selectedEl === null)
        {
            element = this.getNextElement();
            this.selectedEl = element;
            if(this.index === 0)
            {
                this.addToOntoModel(selectedType, undefined, undefined,element);
            }
        }
        else if (selectedUri) 
        {   
            for (let node of this.queryTree)
            {
                if(node.uri.value === selectedUri)
                {
                    element = node;
                    this.selectedEl = element;
                    break;
                }
            }

        }
        else
        {
            element = this.selectedEl; 
            if(this.rulesJson.classes.includes(selectedType))
            {   
                if(elementOrigin === "selected")
                {
                    this.selectedElements.push({uri: element.uri.value});
                }
                this.addToOntoModel(selectedType, undefined, undefined,element);
            }

        }


        
        if(this.rulesJson.classes.includes(selectedType) && elementOrigin !== "selected")
        {     
            this.selectedType = selectedType; 
        }

        rule = this.rulesJson[this.selectedType];  

        if(selectedType === "yes" || selectedType === "no")
        {
            if(selectedType === "yes")
            {
                
                this.addToOntoModel(createdClass, "new", rule);
                selectedUri = null; 
            }
            else
            {
                this.ruleIndex ++;
            }
        }
 
        if (this.ruleIndex === rule.length )
        {
            this.ruleIndex = 0;            
        }

        
        
        ruleResult = this.ruleSelection(rule,element, selectedUri);
        while (ruleResult === false) {
            this.ruleIndex ++;
            ruleResult = this.ruleSelection(rule,element, selectedUri);             
        }
        
        if(ruleResult === true)
        {
            //funkce check parameters 
           
            this.selectedEl = this.getNextElement();
            element = this.selectedEl; 
    
            this.ruleIndex = 0;
            
            return Promise.resolve(this.commonRuleSelection(element));
        }
        else
        {
            return new Promise(resolve => {ruleResult.then(function(results) {
                this.ruleIndex ++;
                resolve(results);
            }.bind(this));
            });
        }
            
    }

    addToOntoModel = (selected, elementUri, rule, element) => 
    {
    

        if(elementUri)
        {
        
            if (elementUri === "new")
            {
                //zapiš to onto Modelu a vypni 
              
                let from = rule[this.ruleIndex - 1].from ;
                let to = rule[this.ruleIndex - 1].to ;

                from = this.ontoModel[this.ontoModel.length + from].uri;
                to  = this.ontoModel[this.ontoModel.length + to].uri;
                this.ontoModel.push({uri: "", label: "NAME", from: from, to: to, ontoType: selected, puroType: null});

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
        // let lement bes

        var label  = element.label.value; 
        var puroType = element.type.value.split('#')[1];
        var relation = "";
        var father = []; 
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
        fromOnto = this.getFatherOntoType(element);
        
        // ještě dopň vztahy
        this.ontoModel.push({uri: element.uri.value, label: label, from: father, ontoType: selected, puroType: puroType});
        console.log(this.ontoModel);
        return true; 
    }

    delUri = (uri) => 
    {
        var result = []; 
        if (typeof uri === 'string')
        {
            return uri.split('#')[1];
        }
        else if (Array.isArray(uri))
        {
            for(let element of uri)
            {
                result.push(element.split('#')[1]);
            }
            return result; 
        }
        else
        {
            return "";
        }
        
    }

    l = (m2) =>
    {
        console.log("CECKKKKKKKKKKKKKKKKKKKKK");
        console.log(m2);
    } 

    getNextElement = () =>
    {
        if (this.isElementUseless(this.queryTree[this.index]))
        {
         this.index ++; 
        }
        for (let index = 0; index < this.ontoModel.length; index ++) 
        {
            if (this.ontoModel[index].uri === this.queryTree[this.index].uri.value)
            {
               
                this.index ++;
                if (this.isElementUseless(this.queryTree[this.index]))
                {
                 this.index ++; 
                }
                index = 0;  
            }
            
        }

       
        return this.queryTree[this.index];

    }

    isElementUseless = (element) =>
    {
        if ('child' in element) {
            if (element.child.length === 0 && element.connect.length === 0 && element.connectFrom.length === 0)
            {       
                return true; 
            }
        } 
        return false; 
    }

    getFatherOntoType = (element) => 
    {

        let result = []; 
        if ('father' in element)
        {
            for (let node of this.ontoModel)
            {
                if(element.father.includes(node.uri))
                {
                    result.push(node.ontoType);
                }
            }
        }

        if(result.length === 0)
        {
            result = [""];
        }
        return result;
    }
        
}




