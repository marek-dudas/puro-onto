import jsonData from './rules.json';
import RdfController from './RdfController.js';
import $ from 'jquery';
import OntoModelController from './OntoModelController';
import { get } from 'http';
// HINT uri u prvních objektů není pole 

// TODO -> neptat se opakovaně na již určené typy... dodělat connnect(kontrola typů) a ukončení -> well done; 


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
 
        var relationsPromise = this.rdfController.getRelations();
        relationsPromise.then(function(results) {
            this.relations = results;   
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

        // Nový začátek 
        this.relationOrderIndex = 0;
        this.relation = null;
        this.relationIndex = 0; 
        this.relationType = null; 
        
        this.relationRuleIndex = 0; 

        this.relationTree = {};
        this.relationTreeIndex = 0; 

        this.elementsWithoutType = [];
        this.withoutTypeIndex = 0; 

        this.elementConsistencyIndex = 0; 
        this.elementConsitencyTree = [];
    }
    
    getDefault = () =>
    {
     
        // tady se zeptej na type relationu 
        // tohle není do defaultu ale do next element
        // hod vyjmku v případě když nebude žádný relation k dispozici
        let relation = this.relations[this.relationOrderIndex];
        this.relation = relation;
        let result = this.rulesJson.relationRules[0].offer.map(function (ruleClass) {
            return {"name": ruleClass, "uri":relation.uri.value, "createdClass": this.delUri(relation.type.value),"origin":"from"};
        }.bind(this));
        return {"buttons": result, "title": this.rulesJson.relationRules[0].question.replace("VAL",relation.label.value)};

    }



    commonRuleSelection = (element, key) => 
    {
        let result = [];
      
        // tohle vyřeš na úrovni onto modelu!
        let fatherOnto = [];
        let childOnto = [];
        let connection = 0;
        if (element.connect !== null)
        {
            connection = element.connect.length + element.connectFrom.length; 
        }
   
        var fatherPuro =  this.delUri(element.fatherType);
        var childPuro =   this.delUri(element.childType);
        
        for (let node of this.ontoController.getOntoModel())
        {
            if (element.father.includes(node.uri)) {
                fatherOnto.push(node.ontoType);
            }
            
        }
        
        for (var rule of this.rulesJson.commonRules)
        {
            
            /*if ((fatherOnto.includes(rule.fatherOnto) || (fatherOnto.length === 0 && rule.fatherOnto === "")) &&
                (fatherPuro.includes(rule.fatherPuro) || (fatherPuro.length === 0 && rule.fatherPuro === "")) &&
                childPuro.includes(rule.childPuro) || childPuro === rule.childPuro &&
                rule.hasRelation <= connection
                )
            */
            if(true)
            {
                for(let val of rule.offer) 
                { 
                    //question atd...
                    result.push({"name":this.rulesJson.classes[val],"createdClass": "elementSelection", "uri":element.uri.value, "origin": key}); 
                }
                return {"buttons": result, "title": element.label.value};
            }
        }
    }


    ruleSelection = (rules, key, element, ontoType, rule) => 
    {
   
        let commands; 
        let additionalRules;
        let offerTypes;
        let uri;
        let question;
        let needElName;
        if (rule)
        {
            offerTypes = rule; 
        }
        else
        {
            commands = this.getSpecificRule(rules,key); 
            additionalRules = this.getAdditionalRule(commands,ontoType);
            offerTypes = (additionalRules.length > 0 ) ? offerTypes = additionalRules : offerTypes = commands.offer; 
        }

        //z Elementu udělej otázku
        if (element !== false)
        {
            if (this.isElementInstace(element))
            {
                needElName =true;
                uri = false;
                question = this.rulesJson.questions[1].question.replace("VAL",element.label.value);
            }
            else
            {
                needElName = false;
                uri = element.uri.value;
                question = this.rulesJson.questions[0].question.replace("VAL",element.label.value);
            }
        }
        else
        {
            uri = false; 
            question = rules.questions[2].question;
        }
       

        let result = offerTypes.map(function (ruleClass) {
            return {"name": ruleClass, "uri": uri, "createdClass": "classSelection" ,"origin": key};
        }.bind(this));
        //get type object -> rozhodni jakou otázku
        // PROČ EL. name???

        return Promise.resolve({"buttons": result, "title": question, "elName": needElName}); 
    }

    // addToOntotype blbě je FROM !!!!
    // kind, uri, dfssf, from/to
    //createdClass: puroType
    nextElement = async (selectedType, selectedUri, puroType, ruleKey,elName) =>
    {  
    
        //první průchod na relataion 
        
        if (puroType === "BRelation")
        {   
           return this.relationWasSelected (selectedType, ruleKey);
        }
        else if (puroType === "classSelection" || puroType === "elementSelection") 
        {
           
            // zápis do ontoModelu 
            //no fatherjelikož je to konec větvě
            if (this.getElementByUri(this.selectedEl.uri.value).father.length > 0)
            {
                //tohle je z ontoModelu!!
                let ontoModel = this.ontoController.getOntoModel();
                let passEl = (selectedUri === false) ? "http://lod2-dev.vse.cz/data/ontomodels#" + elName : this.selectedEl; 
                this.ontoController.addRelation("Dodělat závislé na pravidlech", ontoModel[ontoModel.length -1].uri,passEl);
            }
            //změna z from na to Kvůli TOPIC
            else if(this.relationRuleIndex === 2 && this.getAdditionalRule(this.getSpecificRule(this.rulesJson[this.relationType],ruleKey),selectedType).length === 0)
            {
                let ontoModel = this.ontoController.getOntoModel();
                let lastRelElement;
                //na tohle dávej pozor
                let passEl = (selectedUri === false) ? "http://lod2-dev.vse.cz/data/ontomodels#" + elName : selectedUri;
                for (let node of ontoModel)
                {
                
                    if (node["fromRelation"] === this.relation.label.value)
                    {
                        lastRelElement = node;
                        break;
                    }
                }
                
                this.ontoController.addRelation("Dodělat závislé na pravidlech", lastRelElement.uri,passEl);
            }  
            else if (puroType === "elementSelection")
            {
                let element = this.getElementByUri(selectedUri);

                //father může být pole.. předělat!!!
                let elementFather = this.ontoController.getOntoElement(element.father[0]);
                this.ontoController.addRelation("Dodělat závislé na pravidlech", elementFather.uri , element.uri.value);
            }
          
            this.ontoController.addToOntoModel(selectedUri, this.delUri(selectedUri),selectedType,
            this.delUri(this.selectedEl.type.value),this.relation.label.value,ruleKey,undefined,undefined,elName);
            //Zjištění přídavného pravidla
            let additionalRule = this.getAdditionalRule(this.getSpecificRule(this.rulesJson[this.relationType],ruleKey),selectedType);
            
            if (additionalRule.length > 0)
            {
            
                let prevEl = this.selectedEl; 
                this.selectedEl = this.relationTree[this.relationIndex];
                this.relationIndex --; 

                return Promise.resolve(this.ruleSelection(undefined,ruleKey,this.selectedEl,undefined,additionalRule));
            }
            else
            {
                //change selection or step plus
                //kontrolaElementů na konci
                // proměná co určuje, že se jedná o kontrolu elementu  
                //to pod tim dej před změnu z FROM na TO 
                //elements without type jdeme dále 

                if (this.elementsWithoutType.length === 0)
                {
                    this.elementsWithoutType = this.checkElementsInRelationTree(this.relationTree,this.ontoController.getOntoModel());
                } 
                // přiřazení typu neurčeným elementům 
                if (this.elementsWithoutType.length > 0 && this.withoutTypeIndex < this.elementsWithoutType.length)
                {
                   
                    let element = this.getElementByUri(this.elementsWithoutType[this.withoutTypeIndex].uri.value);
                    this.withoutTypeIndex ++;
                    return Promise.resolve(this.commonRuleSelection(element, ruleKey)); 
                }
                else
                {
                    
                    //projdi všechny elementy a ověř úplnost typů !!!!!!!!!!!!
                    //změnit strany případně nebo skočit na další relation!! jedeme dál..  
                    // this.relator rule.Key pro check elementů
                    let unfinishedTypes = this.checkElementsConsistency(this.relationTree, this.ontoController.getOntoModel(),this.elementConsitencyTree);
                  
                    if (unfinishedTypes.length > 0)
                    {
                        //volej a uvidíš
                    
                    }
                    else
                    {
                        //projdi všechny již zvolené elemnty v onto modelu a zkontroluj úplnost typů
                        //relationRuleIndex > 1 => další relation
                        if (this.relationRuleIndex > 1)
                        {
                            //další relation!! ¨
                            this.relationOrderIndex ++;
                            
                            this.relationRuleIndex = 0; 

                            this.relationTree = {};
                            this.relationTreeIndex = 0; 
                    
                            this.elementsWithoutType = [];
                            this.withoutTypeIndex = 0; 
                
                            this.elementConsistencyIndex = 0; 
                            this.elementConsitencyTree = [];

                            return Promise.resolve(this.getDefault());

                        }
                        
                        ruleKey = this.relationRuleIndex === 0 ? "from" : "to";
                        let bTypes = this.getRelatedElements(this.relation,ruleKey);
                        this.relationRuleIndex ++; 
                        
                        return new Promise(resolve => {bTypes.then(function(results) {

                            results.unshift(this.getElementByUri(this.relation[ruleKey].value));
                            
                            let rule = this.rulesJson[this.relationType];
                            this.relationTree = results; 
                            this.relationIndex = this.relationTree.length - 1; 
                            
                            //Zkontroluj zda element useless a jaký typ!!! 
                            this.selectedEl = this.relationTree[this.relationIndex];
                            //počítá se dle délky pole +1!!
                            this.relationIndex --;
                            resolve(this.ruleSelection(rule,ruleKey,this.selectedEl));
                        }.bind(this));});
                    }
                }

            


            }

        }
            
    }

    checkElementsConsistency = (ontoModel,relation,ruleKey) =>
    {
        
        if (this.elementConsitencyTree.length === 0)
        {
            for (let node of ontoModel)
            {
                if (node.fromRelation === relation && node.direction === ruleKey)
                {
                    this.elementConsitencyTree.push(node); 
                }
            }

            if (this.elementConsitencyTree.length === 0)
            {
               return this.elementConsitencyTree; 
            }
        }
        
        let elementTypes = this.elementConsistencyRules(this.elementConsitencyTree[this.elementConsistencyIndex],ontoModel);
        while (this.elementConsitencyTree.length < this.elementConsistencyIndex && elementTypes.length === 0)
        {
            this.elementConsistencyIndex ++; 
            elementTypes = this.elementConsistencyRules(this.elementConsitencyTree[this.elementConsistencyIndex],ontoModel);
        }

        return elementTypes; 


    }

    elementConsistencyRules(element)
    {
            
            // v případě undefinied vyhoď, že pravidlo není definováno 
            let rules = this.rulesJson[element.ontoType]; 

            
            let check = []; 

            //Tady by měla být pole jelikož to může být 1:N 
            let subEl = this.ontoController.getElementsRelation(element.uri, "from").to;
            let superEl = this.ontoController.getElementsRelation(element.uri, "to").from;
            
            let superElType = this.ontoController.getElementOntoType(superEl);
            let subElType = this.ontoController.getElementOntoType(subEl);


            for (let rule of rules)
            {
                if(rule.key === "supeType")
                {
                     if (!rule.type.includes(element.fatherType))
                       {
                           check.push({key: "superType", types: rule.type});
                       }
                }
                else // subType
                {
                       if (!rule.type.includes(element.childType))
                       {
                           check.push({key: "subType", types: rule.type});
                       }
                }  
            }
            
            return check;
    }

    relationWasSelected = (selectedType, ruleKey) => 
    {
        
        this.relation = this.relations[this.relationOrderIndex];
        this.relationType = selectedType; 
        //selected type do object property
        let rule = this.rulesJson[selectedType];
        
        this.relationTreeIndex = 0; 
        let relationTree = this.getRelatedElements(this.relation,ruleKey);
        
        this.relationRuleIndex ++; 

        this.ontoController.addToOntoModel(this.relation.uri.value, this.relation.label.value, selectedType, this.relation.type.value,
            this.relation.uri.value, undefined, this.relation.from.value, this.relation.to.value);
        
        return new Promise(resolve => {relationTree.then(function(results) {


            results.unshift(this.getElementByUri(this.relation[ruleKey].value)); 
            this.relationTree = results; 
            this.relationIndex = this.relationTree.length - 1; 
            
            this.selectedEl = this.relationTree[this.relationIndex];
            this.relationIndex --;
          
            resolve(this.ruleSelection(rule,ruleKey,this.selectedEl));
         }.bind(this));});
    }

    checkElementsInRelationTree = (tree, ontoModel) =>
    {
        // možná by nebylo od věci zkontrolovat úplnost zvolených typů!!!
        let elementsWithoutType = [];
        let withoutType = true; 
        for (let element of tree)
        {
            withoutType = true;
            for (let node of ontoModel)
            {
                if(element.uri.value === node.uri)
                {
                    withoutType = false;
                }
            }

            if (withoutType === true && !this.isElementUseless(element) && ! this.isElementInstace(element))
            {
                elementsWithoutType.push(element); 
            }
        }
        return elementsWithoutType; 
    }

    getAdditionalRule = (rule, selectedType) =>
    {

        if (selectedType in rule)
        {
            return rule[selectedType];
        }
        else
        {
            return [];
        }
    }

    getSpecificRule = (rules, key) =>
    {
        console.log(rules)
        for (let node of rules)
        {
            if (node.key === key)
            {
                return node; 
            }
        }

        return false; 
    }

    getRelatedElements = (relation, key) =>
    {
        return this.rdfController.getRelationBTypes(relation[key].value);    
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

    isElementInstace = (element) =>
    {
        for (let node of this.queryTree)
        {
           
            if (element.uri.value === node.uri.value  )
            {
                for (let type of node.fatherTypeRelation)
                {
                    if (this.delUri(type) === "instanceOf")
                    {
                        return true; 
                    }
                }
            
            }
        }
        return false; 
        
    } 

    // element ve formátu queryTree!!
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
}




