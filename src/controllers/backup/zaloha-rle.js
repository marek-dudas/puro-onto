import jsonData from './rules.json';
import RdfController from './RdfController.js';
import $ from 'jquery';
import OntoModelController from './OntoModelController';
// HINT uri u prvních objektů není pole 


export default class RuleController {


    constructor() {
        this.rulesJson = JSON.parse(JSON.stringify(jsonData));      
        this.rdfController = new RdfController(); 
        this.ontoController = new OntoModelController();  
        var queryTreePromise = this.rdfController.getFullPath();
        queryTreePromise.then(function(results) {
            this.queryTree = results;   
            console.log(results);        
        }.bind(this));
 
       // this.ontoModel = [];
        this.index = 0;
        this.ruleIndex = 0;
        this.typeSelection = true;
        this.selectedEl = null;
        this.selectedType =null;
        this.lastSelectedType = null;
        this.checkElements = [];
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
            let ontoModel = this.ontoController.getOntoModel();
            var connectedOntoTypes = [];
            // udělat kontrolu jestli už byla zvolena pak přeskoč!!! a máme hotovo
           
            for (let node of ontoModel)
            {
                for(let father of element.father)
                {  
                    if (father === node.uri)
                    {
                        connectedOntoTypes.push(node.ontoType); 
                    }
                }

                for(let child of element.child)
                {  
                    if (child === node.uri)
                    {
                        connectedOntoTypes.push(node.ontoType); 
                    }
                }   
            }




            // tohle je zle ->   zavislé na ONTOMODELU nikoli na PURO modelu.. !!!!!!
            //přidej onto model!!!  
            if(rule[this.ruleIndex].connect.some(r=> connectedOntoTypes.includes(r)) && this.delUri(element.type.value)!=="BObject")
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
                    //když nebude sedět hodit chyby ve špatně nastavených pravidlech
                    let ontoElement = this.ontoController.getOntoElement(element.uri.value);
                    if (ontoElement !== false && rule[this.ruleIndex].connect.includes(ontoElement.ontoType))
                    {
                        return false; 
                    }
                    else
                    {
                        let result = rule[this.ruleIndex].connect.map(function (ruleClass) {
                            return {"name": ruleClass, "uri":null, "origin":"selected"};
                        });
                        return Promise.resolve({"buttons": result, "title": rule[this.ruleIndex].question.replace("VAL",element.label.value), "elName":element.label.value});
                    }
                }
                else
                {
                    
                    //cyklus!!!!!!!!!!!!!!!!!!! child > 1
                    // child or non selected father 
                    let i = this.ruleIndex; 
                    let buttons = [];    
                    
                    // duplicita udělej funkci  
                    buttons =  buttons.concat(this.getConnectedElements(rule,element.child));
                    buttons =  buttons.concat(this.getConnectedElements(rule,element.father));

                    // Spustí se taky když uživatel klikne na tlačítko more => dodělat 
                    if (buttons.length < 1)
                    {
                        for (let ruleOntoType of rule[this.ruleIndex].connect)
                        {
                            //odstran duplicity v případě, opakování... ber to od konce kvůli pořadí
                            for (let ontoUri of this.ontoController.getElementsByOntoType(ruleOntoType))
                            {
                                buttons.push({"name": this.delUri(ontoUri) +"["+ruleOntoType+"]", "uri": ontoUri});
                            }
                        }    
                    }

                    // ještě se to sem musí vrátit aby se určil typ; 
                    this.ruleIndex --;
                    return Promise.resolve({"buttons": buttons, "title": rule[i].question.replace("VAL", element.label.value), "elName":false});
                }



            }
        } 
        // zkontroluj v případě dvojic //půjde jako kod nikoli element 
        else if ("findRelation" in rule[this.ruleIndex])
        {
            let ontoModel = this.ontoController.getOntoModel();
            // ověření již ověřeního spoje 

            // dodělat pouze pro jednoduchý model!!!!
            for (let node of ontoModel)
            {
                if ("from" in node) {
             
                    if (node.from === element.uri.value || node.to === element.uri.value)
                    {
                       let ontoElUri = (node.from === element.uri.value) ? node.from : node.to;
                  
                       let OntoType =  this.ontoController.getElementOntoType(ontoElUri)
                       if (rule[this.ruleIndex + 1].connect.includes(OntoType))
                       {
                            // skip create relator
                            this.ruleIndex += 2;
                            return false; 
                       }
                    }
                }
            }

               let child; 

                // zvláštně napsané to půjde jinak!!!! 
               if(this.delUri(element.childRel[0]) === "instanceOf")
               {
                child = this.getElementByUri(element.child[0]); 

               }
               else if (this.delUri(element.childRel[0]) === "subTypeOf")
               {
                 child = this.getElementByUri(element.child[0]);  
                 child = this.getElementByUri(child.child[0]); 
               } 

            // ometení pouze na selected
            if (element.connect.length > 0 || element.connectFrom.length > 0 || child.connectFrom.length > 0 || child.connect.length ) {
                //podívej se pres relator na objekt ci subtype
                //podivej se na okolní 
                var endBTypes = [];
                var connection; 
                var from; 
                // tady pole v případě více dětí!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!§
                if (element.connect.length > 0 || element.connectFrom.length > 0)
                {
                    from = element.uri.value;
                    connection = element.connect.concat(element.connectFrom); 
                }
                else
                {
                    from = child.uri.value;
                    connection = child.connectFrom.concat(child.connect); 
                }

                // Duplicity delete 
                connection = Array.from(new Set(connection));
                for (let relation of connection)
                {
                   endBTypes.push(this.rdfController.getRelatorBtype(relation, from));
                }
                return Promise.all(endBTypes).then(function(results) {

                   
                    var buttons = [];    
                    for (var el of results) {
                      //ověření onto typu jestli je v povolených v případě connect yes ATD....
                      if (el[0].father.value === null)
                      {
                        let ontoType = this.ontoController.getElementOntoType(el[0].element.value);
                        ontoType = (ontoType === false) ? "" : " ["+ontoType+"]";
                        buttons.push({"name":el[0].elementLabel.value + ontoType, "uri":el[0].element.value, "relName":el[0].relationName});
                      }
                      else
                      {     
                        let ontoType = this.ontoController.getElementOntoType(el[0].father.value);
                        ontoType = (ontoType === false) ? "" : " ["+ontoType+"]";
                        buttons.push({"name":el[0].fatherLabel.value + ontoType, "uri":el[0].father.value,"relName":el[0].relationName});
                      }            
                    }
                    //podívej jestli už nemá určený typ.. pokud ano krok +2 

                    //!! zkontroluj z query relator 
                    return ({"buttons": buttons, "title":rule[this.ruleIndex].question.replace("VAL",element.label.value),"elName": false} );
                
                }.bind(this));
                
            }
            else{
           
                return false; 
            }
        }
        else if ("create" in rule[this.ruleIndex])
        { 
            
            var returnVal = [{"name": "yes", "uri": null, "createdClass": rule[this.ruleIndex].create}, {"name": "no", "uri": null}]
            return Promise.resolve({"buttons": returnVal, "title":rule[this.ruleIndex].question.replace("VAL",element.label.value), "elName": element.label.value}); 
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

    getConnectedElements = (rule, elements) =>
    {
        let result = [];
        for (let element of elements)
        {
            let ontoType = this.ontoController.getElementOntoType(element);

            if (ontoType === false || rule[this.ruleIndex].connect.includes(ontoType))
            {
                let name = (ontoType !== false) ? this.delUri(element)+ " ["+ontoType+"]" : this.delUri(element);
                result.push({"name": name, "uri":element})
            }
            
        }
        return result;
    }

    getDefault = () =>
    {
         var result;
        
         result = this.rulesJson.classes.map(function (ruleEl) {
            return {"name": ruleEl, "uri":null};
          });
         return  {"buttons": result,"title": this.rulesJson.questions[0].replace("VAL",this.queryTree[this.index].label.value)};   

    }

    commonRuleSelection = (element) => 
    {
      
        var result = [];
        var fatherOnto = [];
        var connection = 0;
        var ontoModel = this.ontoController.getOntoModel();


        if (element.connect !== null)
        {
            connection = element.connect.length + element.connectFrom.length; 
        }
   
        var fatherPuro =  this.delUri(element.fatherType);
        var childPuro =   this.delUri(element.childType);
        
        for (let node of ontoModel)
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
                return {"buttons": result, "title": this.rulesJson.questions[0].replace("VAL", element.label.value),"elName": element.label.value};
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
                this.ontoController.addToOntoModel(selectedType,element);
               // this.addToOntoModel(selectedType, undefined, undefined,element);
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

                this.ontoController.addToOntoModel(selectedType,element, undefined, undefined, elementOrigin);
                if (elementOrigin === "selected")
                {
                   
                    let lastElUri = this.ontoController.getLastElementUri("list"); 
                    this.selectedEl = this.getElementByUri(lastElUri); ;
                    element = this.selectedEl;
                }
               // this.addToOntoModel(selectedType, undefined, undefined,element);
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
                
                //this.addToOntoModel(createdClass, "new", rule);
                this.ontoController.addToOntoModel(createdClass,"new",rule,this.ruleIndex)
                selectedUri = null; 
            }
            else
            {
                this.ruleIndex ++;
            }
        }
 

        // lepší pridat funkci pro ověření
        
        if (this.ruleIndex !== rule.length)
        {
        
            ruleResult = this.getButtons(rule,element,selectedUri); 
        }
        else
        {
            this.selectedEl = this.getNextElement();
            element = this.selectedEl; 
            let elOntoType = this.ontoController.getElementOntoType(element.uri.value);
            if (elOntoType !== false)
            {
                rule = this.rulesJson[elOntoType];  
                this.ruleIndex = 0; 
                ruleResult = this.getButtons(rule,element,selectedUri);
            }            
        }
        
         
    
        if(ruleResult === true || this.ruleIndex === rule.length)
        {
            //funkce check parameters 
            
            this.selectedEl = this.getNextElement();
            element = this.selectedEl; 
            this.ruleIndex = 0;  

            let elOntoType = this.ontoController.getElementOntoType(element.uri.value);

            if (elOntoType !== false)
            {
               let buttons;
               this.selectedType = elOntoType;
               rule = this.rulesJson[this.selectedType];
               let stop = false;
              
               while (elOntoType !== false && stop === false) {       
                  buttons = this.getButtons(rule,element, selectedUri);
                  if (buttons === true || this.ruleIndex === rule.length)
                  {
                    this.ruleIndex = 0;
                    this.selectedEl = this.getNextElement();
                    element = this.selectedEl;
                    rule = this.rulesJson[this.selectedType]; 
                    elOntoType = this.ontoController.getElementOntoType(element.uri.value); 
                  }  
                  else 
                  {
                      stop = true; 
                  }

                } 
         
                if (buttons === true)
                {
                    console.log(element); 
                    return Promise.resolve(this.commonRuleSelection(element)); 
                }
                else
                {
                    this.ruleIndex ++; 
                    return Promise.resolve(buttons);
                }
            }
            else
            {
                return Promise.resolve(this.commonRuleSelection(element));
            }
            
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

    getButtons =  (rule,element, selectedUri) => 
    {
       
        var ruleResult;
        ruleResult = this.ruleSelection(rule,element, selectedUri);
        // tohle zruš protože v tom nevidím význam 
        while (ruleResult === false && this.ruleIndex < rule.length) {
            this.ruleIndex ++;
            if(this.ruleIndex < rule.length) 
            {
                ruleResult = this.ruleSelection(rule,element, selectedUri);   
            }                  
        }
        
        if (this.ruleIndex === rule.length)
        {
            return true; 
        }
        return ruleResult;
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
        let ontoModel = this.ontoController.getOntoModel();
        if (this.isElementUseless(this.queryTree[this.index]))
        {
         this.index ++; 
        }
        for (let index = 0; index < ontoModel.length; index ++) 
        {
            if (ontoModel[index].uri === this.queryTree[this.index].uri.value && ontoModel[index].origin !== "selected")
            {
               
                this.index ++;
                if (this.isElementUseless(this.queryTree[this.index]))
                {
                 this.index ++; 
                }
                index = 0;  
            }
            
        }  
        
        this.ontoController.changeOrigin(this.queryTree[this.index].uri.value, "list");
        
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

    getElementByUri = (uri) =>
    {
        for (let node of this.queryTree)
        {
            if (node.uri.value === uri) {
                return node; 
            }
        }
        return false; 
    }
     
}




