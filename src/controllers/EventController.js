import jsonData from './rules.json';
import RdfController from './RdfController.js';
import OntoModelController from './OntoModelController';
import ImageController from './ImageController.js';
import RuleController from './RuleController.js';
// TODO -> v případě dvou otců projdi cyklem a zkontroluj oba!!!!
// TODO -> vyřešit vazby
// TODO -> next element do objektového schématu -> zatím prototyp 
// TODO -> třída element pro sjednocení properties 
// UNDO 

export default class EventController {
    constructor() {
        
        this.rulesJson = JSON.parse(JSON.stringify(jsonData));      
        this.rdfController = new RdfController(); 
        this.ontoController = new OntoModelController();  
        this.imageController = new ImageController();
        this.ruleController = new RuleController(this.rulesJson);
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

                     
        this.ontoUri = "http://lod2-dev.vse.cz/data/ontomodels#";


        this.selectedEl = null;
        this.elSettings = {};
        // Nový začátek 

        this.relationOrderIndex = 0;
        this.relation = null;
        this.relationIndex = 0; 
        this.relationType = null; 

        this.relationTreeIndex = 0; 
        this.relationTreeArr = [];
        
        this.setIndexexToDefault();
    }
    
    getDefault = () =>
    {
     
        // tady se zeptej na type relationu 
        // tohle není do defaultu ale do next element
        // hod vyjmku v případě když nebude žádný relation k dispozici
        let relation = this.relations[this.relationOrderIndex];
        this.relation = relation;

        if(this.relation.valuation.length > 0)
        {
            return this.nextElement("Relator",this.relation.uri.value,"BRelation","from");
        }
        else
        {
            let result = this.rulesJson.bRelationRules[0].offer.map(function (ruleClass) {
                return {"name": ruleClass, "uri":relation.uri.value, "origin":"from"};
            }.bind(this));
            
            return {"buttons": result, "title": this.rulesJson.bRelationRules[0].question.replace("VAL",relation.label.value), "type": this.delUri(relation.type.value) };
        }
    }



    // předělat do objektů a metod-> sjednotit kód 
    //puroType createdClass 
    nextElement = async (selectedType, selectedUri, puroType, ruleKey,elName) =>
    {  
        
        //první průchod na relataion 
        if (puroType === "BRelation")
        {   
       
           return this.relationWasSelected (selectedType, ruleKey);
        }
        else //(puroType === "classSelection" || puroType === "elementSelection") 
        {
            //Jméno půjde měnit vždy.. teď záleží  
            
            
            // create relation 
            let relationEl; 
            let additionalRule; 
            let relFlow = puroType;
            let relType; 
            let elRelTypes;

            if (puroType.includes("ontoRelation-save-bRelation"))
            {
                if(puroType.includes("relator"))
                {
                    let direction = puroType.replace("ontoRelation-save-bRelation-relator-","");
                    if(direction === "from")
                    {
                        this.ontoController.updateOntoModel(this.relation.uri.value,"fromType", selectedType);
                    }
                    else
                    {
                        this.ontoController.updateOntoModel(this.relation.uri.value,"toType", selectedType);
                    }
                }
                else
                {
                    this.ontoController.updateOntoModel(this.relation.uri.value,"fromType", selectedType[0]);
                    this.ontoController.updateOntoModel(this.relation.uri.value,"toType", selectedType[1]);
                }
                selectedType = this.elSettings.selectedType;
                selectedUri = this.elSettings.selectedUri;
                puroType = this.elSettings.puroType;
                ruleKey = this.elSettings.ruleKey;
                elName = this.elSettings.elName;
                relationEl = this.elSettings.relationEl;
                additionalRule = this.elSettings.additionalRule; 

            }
          
            if (!puroType.includes("ontoRelation")  && puroType !== "dataType")
            {
               additionalRule = this.ruleController.getAdditionalRule(this.ruleController.getSpecificRule(this.rulesJson[this.relationType],ruleKey),selectedType);

               relationEl = this.ontoController.getRelationElements(elName, this.getElementByUri(selectedUri), selectedUri,this.relation.uri.value, additionalRule.length, this.relationRuleIndex, puroType, this.ontoUri, ruleKey);
               this.elSettings = {selectedType: selectedType, selectedUri: selectedUri, puroType: puroType, ruleKey:ruleKey, elName:elName, relationEl: relationEl, additionalRule: additionalRule, relType: ""};
               //alert(relationEl)
               if (relationEl === this.relation.uri.value)
               {
                  
                 let updateRelTypes = this.updateRelationTypes();
                 if (updateRelTypes !== false)
                 {
                     return updateRelTypes;
                 }
               }
            }
            else if(puroType === "dataType")
            {
                //kolala
                relationEl = [selectedType, this.ontoUri+elName];
                this.elSettings.relationEl = relationEl;
                this.elSettings.relType = "Row"
                //Ulož DataType do ontoModelu -> pushovat na začátek
                this.ontoController.addToOntoModel(this.ontoUri+elName,elName,"Datatype","BValue",this.relation.uri,ruleKey);
            }
            else 
            {
                if (puroType.includes("ontoRelation-cardinality"))
                {
                    this.elSettings.relType = selectedType; 
                }
                else if (puroType.includes("ontoRelation-save"))
                {
                    elRelTypes = selectedType;
                }

                selectedType = this.elSettings.selectedType;
                selectedUri = this.elSettings.selectedUri;
                puroType = this.elSettings.puroType;
                ruleKey = this.elSettings.ruleKey;
                elName = this.elSettings.elName;
                relationEl = this.elSettings.relationEl;
                additionalRule = this.elSettings.additionalRule; 

            }
            
            let relationRules = this.getRelationRules(relationEl, relFlow, selectedUri,ruleKey, this.elSettings.selectedType, this.elSettings.relType, elRelTypes);
    
            if (relationRules !== true)
            {
                //vrácení otázky v případě true relation ulož -> může se pokračovat
                return Promise.resolve(relationRules); 
            }

            //VALUES CHECK -> pak vrat další větev

            if (this.valuationArr !== null)
            {
                if (this.valuationArr.length > 0)
                {
                    let button = [{"name": this.valuationArr[0].el, "uri":this.valuationArr[0].valuation, "origin":ruleKey}];
                    // create good question 
                    let question = "Which Datatype represents " + this.delUri(this.valuationArr[0].valuation) + "?"; 
                    this.valuationArr.shift(); 
                    return Promise.resolve({"buttons": button , "title": question, "type": "dataType", "elName": true});   
                }
                else if(this.valuationArr.length === 0)
                {
                    return this.nextTreeBranch(ruleKey); 
                }
            }

            //Přidání do ontomodelu 
            this.ontoController.addToOntoModel(selectedUri, this.delUri(selectedUri),selectedType,
            this.delUri(this.selectedEl.type.value),this.relation.uri.value,ruleKey,undefined,undefined,elName);
            

            

            //zjištění dodatečných pravide 
            if (additionalRule.length > 0)
            {
                this.selectedEl = this.getNextElement;   
                console.log(additionalRule);
                //aditional rule 
                return Promise.resolve(this.ruleController.ruleSelection(undefined,ruleKey,this.selectedEl,undefined,additionalRule,this.queryTree));
            }
            else
            {
                //change selection or step plus
                //kontrolaElementů na konci
                // proměná co určuje, že se jedná o kontrolu elementu  

                if (this.elementsWithoutType.length === 0)
                {
                    this.elementsWithoutType = this.checkElementsInRelationTree(this.relationTree,this.ontoController.getOntoModel());
                } 
                // přiřazení typu neurčeným elementům 
                if (this.elementsWithoutType.length > 0 && this.withoutTypeIndex < this.elementsWithoutType.length)
                {
                    let element = this.getElementByUri(this.elementsWithoutType[this.withoutTypeIndex].uri.value);
                    
                    this.withoutTypeIndex ++;
                    
                    return Promise.resolve(this.ruleController.commonRuleSelection(element, ruleKey,this.ontoController.getOntoModel())); 
                }
                else
                {
                    if (this.ontoController.getOntoElement(this.relation.uri.value).from === "")
                    {
                        let lastElUri = this.ontoController.getLastElementUri(this.relation.uri.value);
                        this.ontoController.updateOntoModel(this.relation.uri.value, ruleKey, lastElUri);
                    }
                    //projdi všechny elementy a ověř úplnost typů !!!!!!!!!!!!
                    //změnit strany případně nebo skočit na další relation!! jedeme dál..  
                    // this.relator rule.Key pro check elementů
                    
                    let unfinishedTypes = this.checkElementsConsistency(this.relation.uri.value, ruleKey); 
                    if (unfinishedTypes.length > 0)
                    {
                
                        // upravit na funkci
                        
                        let question = "";
                        
                        console.log(unfinishedTypes);
                        
                        if ("question" in unfinishedTypes[0].rule)
                        {

                            for (let q of this.rulesJson.questions)
                            {
                                if (q.type === unfinishedTypes[0].rule.question)
                                {
                                    question = q.question;
                                    break;
                                }
                            }
                            

                            question = (question === "") ? unfinishedTypes[0].question : question; 
                            let qType = (unfinishedTypes[0].key in unfinishedTypes[0].rule) ? unfinishedTypes[0].rule[unfinishedTypes[0].key][0] : unfinishedTypes[0].rule.type[0];
                            question =  question.replace("VAL", this.delUri(unfinishedTypes[0].element)).replace("TyPe",qType); 
                        }
                        else
                        {
                            question = "What is " + unfinishedTypes[0].key + " of " + this.delUri(unfinishedTypes[0].element);
                        }


                        let mappedButtons = unfinishedTypes[0].types.map(function (ruleClass) {
                            return {"name": ruleClass, "uri": unfinishedTypes[0].element, "origin": ruleKey};
                        }.bind(this));

                        return Promise.resolve({"buttons": mappedButtons, "title": question, type: unfinishedTypes[0].key, "elName": true}); 
                               
                    }
                    else
                    {
                     
                        //projdi všechny již zvolené elementy v onto modelu a zkontroluj úplnost typů
                        //relsationRuleIndex > 1 => další relation

                        
                        if (this.relationRuleIndex > 1)
                        {
                            //další relation!! 
                            this.setIndexexToDefault(); 

                            this.relationOrderIndex ++;
                            
                            if (this.relationOrderIndex === this.relations.length)
                            {
                                alert("Transformation is comlete!!!");
                                return Promise.resolve({buttons: [], title: "The End", type: "end"});
                            }
                            else
                            {
                                return Promise.resolve(this.getDefault());
                            }
                            
                        }
                        
                        //Doplň VALUE 
                        if (this.valuationArr === null)
                        {
                            this.valuationArr = this.getAllTreeValuations(ruleKey);
                            // vrat dotaz na Value
                            if (this.valuationArr.length > 0)
                            {
                                let question = "Which Datatype represents " + this.delUri(this.valuationArr[0].valuation) + "?";
                                let button = [{"name": this.valuationArr[0].el, "uri":this.valuationArr[0].valuation, "origin":ruleKey}];
                                this.valuationArr.shift(); 
                                return{"buttons": button , "title": question, "type": "dataType", "elName": true};
                            }
                        }
                        //přepnutí na další větev
                        return this.nextTreeBranch(ruleKey);
                    }
                }

            


            }

        }
            
    }

    updateRelationTypes = () =>
    {
        let ontoRel = this.ontoController.getOntoElement(this.relation.uri.value);
        
        if (ontoRel.to !== undefined && ontoRel.from !== undefined)
        {
            //koala
            if (ontoRel.ontoType === "Relator" && ontoRel.fromType === undefined)
            {
                let rule = this.ruleController.getSpecificRule(this.rulesJson[ontoRel.ontoType],"cardinality");
                return this.createRelCardinalityBtn("ontoRelation-save-bRelation-relator-from",rule,"from",ontoRel.from,ontoRel.uri);
            }
            else if (ontoRel.ontoType === "Relator" && ontoRel.toType === undefined) 
            {
                let rule = this.ruleController.getSpecificRule(this.rulesJson[ontoRel.ontoType],"cardinality");
                return this.createRelCardinalityBtn("ontoRelation-save-bRelation-relator-to",rule,"to",ontoRel.uri,ontoRel.to);
            }
            else if (ontoRel.toType === undefined && ontoRel.fromType === undefined )
            {
                let rule = this.ruleController.getSpecificRule(this.rulesJson[ontoRel.ontoType],"cardinality");
                return this.createRelCardinalityBtn("ontoRelation-save-bRelation",rule,"to",ontoRel.from,ontoRel.to);
            }
        }
        
        return false; 
    }


    nextTreeBranch = (ruleKey) => 
    {

        if (this.ontoController.getOntoElement(this.relation.uri.value).from === "")
        {
            let lastElUri = this.ontoController.getLastElementUri(this.relation.uri.value);
            this.ontoController.updateOntoModel(this.relation.uri.value, ruleKey, lastElUri);
        }
        
        this.relationRuleIndex ++; 

        let relationTypePromise; 

        if (this.relationTreeIndex === this.relationTreeArr.length)
        {
       
            ruleKey = this.relationRuleIndex === 0 ? "from" : "to";
            relationTypePromise = this.getRelatedElements(this.relation,ruleKey);
        }
        else
        {   
            relationTypePromise = Promise.resolve(this.relationTreeArr);
        }

        return new Promise(resolve => {relationTypePromise.then(function(results) {
            this.valuationArr = null; 
            resolve (this.handleRelatedElements(results,"nextElement",ruleKey))
        }.bind(this));});
    }

    getAllTreeValuations = (ruleKey) =>
    {
        let valuations = [];
        for(let relEl of this.relationTree)
        {
          
            let el = this.getElementByUri(relEl.uri.value);
            if (el.valuation.length > 0)
            {
                for (let valuation of el.valuation)
                {
                    valuations.push({el: el.uri.value, valuation: valuation})
                }
            }
        }

        if(ruleKey === "from")
        {
            for (let valuation of this.relation.valuation)
            {
                valuations.push({el: this.relation.uri.value, valuation: valuation})
            }
        }
        return valuations; 
    }


    getGraphSvg = () =>
    {
      let ontoModel = this.ontoController.getOntoModel();
      let svg = this.imageController.createGraph(ontoModel);
      return svg; 
    }
    
    createRelCardinalityBtn = (type, rule, ruleKey, fromE, toE, relationFlow, elUri) =>
    {
        type += (relationFlow === "dataType") ? "-daType" : ""; 
        let fromB = rule.fromT.map(function (ruleClass) {
            return {"name": ruleClass, "uri":elUri,"origin":ruleKey, direction: "from"};
            }.bind(this));
        
        let toB = rule.fromT.map(function (ruleClass) {
            return {"name": ruleClass, "uri":elUri,"origin":ruleKey, direction: "to"};
        }.bind(this));
        
        return {"buttons": toB.concat(fromB) , "title": "Select cardinality between elements", "type": type, "elName": [this.delUri(fromE), this.delUri(toE)]};
    }

    getRelationRules = (elements, relType, elUri, ruleKey,ontoType, relOntoType, elRelTypes ) => 
    {
        
        //type save relation - type -> podradnost -> ulozeni 
        // this.relationType = definice type 
        // 
    

        let fromE;
        let toE;

        let fromEType;
        let toEType; 

        let relationFlow = relType.replace("ontoRelation-", "");
        let rule;
        let relationRules = this.rulesJson.relationRules;  
       



        //dostanu příchozí elementy 
        if (Array.isArray(elements)) {
           fromE = elements[0];
           toE = elements[1];

           fromEType = this.ontoController.getElementOntoType(fromE);
           toEType = this.ontoController.getElementOntoType(toE);

           fromEType = fromEType === false ? ontoType : fromEType;
           toEType = toEType === false ? ontoType : toEType; 
           rule = this.findRule(relationRules, ["from", fromEType, "to", toEType]);
        }
        else
        {
            //pouze upravím dosavadní element  modify
            return true; 
        }


        
        if ((relationFlow === "cardinality" || relationFlow === "dataType" || rule.offer.length === 1) && !relationFlow.includes("save"))
        {
            if ("fromT" in rule && "toT" in rule)
            {
                
                this.elSettings.selectedType = (rule.offer.length === 1) ? rule.offer[0] : this.elSettings.selectedType ;   
                return this.createRelCardinalityBtn("ontoRelation-save",rule,ruleKey,fromE,toE,relationFlow,elUri);
            }
            else
            { 
                relOntoType = (rule.offer.length === 1) ? rule.offer[0] : relOntoType; 
                this.ontoController.addRelation(relOntoType, fromE, toE, "uriDomyslet", "nazev", "", "");
                return true;
            }

            
        }
        else if (relationFlow.includes("save"))
        {
            //ulož do model
            this.ontoController.addRelation(relOntoType, fromE, toE, "uriDomyslet", "nazev", elRelTypes[0], elRelTypes[1]);
            return true;
        }
        else
        {

           let result = rule.offer.map(function (ruleClass) {
            return {"name": ruleClass, "uri":elUri,"origin":ruleKey};
           }.bind(this));
           return {"buttons": result, "title": "Which type of relation is between "+ this.delUri(fromE) +" and " + this.delUri(toE)+"?", "type": "ontoRelation-cardinality"};

           // pokud pouze jeden offer aplikuj a zavolej 
           if (rule.offer.length > 1)
           {
               // kod vyse ě
           }
           else
           {
               return  this.relationCardility (); 
           }
        }
        
        
    }

    findRule = (rules, condition) =>
    {
        let validity = false;  
        for (let rule of rules)
        {
            validity = false;
            for (let index = 0; index < condition.length; index += 2 ) {
              
                for (let ontoType of rule[condition[index]])
                {
                    if (condition[index + 1] === ontoType || ontoType === "*")
                    {   
                        if (validity === true)
                        {
                            return rule; 
                        } 
                        validity = true;
                        break; 
                    }

                }
               
            }
        }

        return false; 
    }

    relationWasSelected = (selectedType, ruleKey) => 
    {
       
        this.relation = this.relations[this.relationOrderIndex];
        this.relationType = selectedType; 
        //selected type do object property
  
        let rule = this.rulesJson[selectedType];
        let relationTreePromise;
        
        if(this.relationTreeArr.length === this.relationTreeIndex)
        {
            relationTreePromise = this.getRelatedElements(this.relation,ruleKey);
        }
        else
        {
            relationTreePromise = Promise.resolve(this.relationTreeArr);
        }
        
        
        this.relationRuleIndex ++; 

        //this.ontoController.addToOntoModel(this.relation.uri.value, this.relation.label.value, selectedType, this.relation.type.value,
        //    this.relation.uri.value, undefined, this.relation.from.value, this.relation.to.value);

        this.ontoController.addRelation(selectedType, "" , "", this.relation.uri.value, this.relation.label.value);

        
        return new Promise(resolve => {relationTreePromise.then(function(results) {

            resolve (this.handleRelatedElements(results,"relationWasSelected", ruleKey, rule));

         }.bind(this));});
    }

    handleRelatedElements = (elements, origin, ruleKey, rule) =>
    {
       
        this.relationTreeArr = elements; 
        this.relationTree = elements[this.relationTreeIndex];
        this.relationTreeIndex ++; 
        this.relationIndex = this.relationTree.length - 1; 

        if (origin === "relationWasSelected")
        {
            this.selectedEl = this.getNextElement();
            
            //rychlá záplata -> předělat -> už zvolen koko
            let el = this.getElementByUri(this.selectedEl.uri.value)
            let additionalRule = [];
            
            if (el.father.length > 0)
            {
                let fatherType = this.ontoController.getElementOntoType(el.father[0]); 
                if (fatherType !== false)
                {
                   console.log(el);
                   additionalRule = this.ruleController.getAdditionalRule(this.ruleController.getSpecificRule(rule,ruleKey),fatherType);
                }
            }

            if (additionalRule.length === 0)
            {
           
                return (this.ruleController.ruleSelection(rule,ruleKey,this.selectedEl,undefined,undefined,this.queryTree));
            }
            else
            {
              return (this.ruleController.ruleSelection(undefined,ruleKey,this.selectedEl,undefined,additionalRule,this.queryTree));
            }
        }
        else
        {
            let rule = this.rulesJson[this.relationType];
            //Zkontroluj zda element useless a jaký typ!!! 
            this.selectedEl = this.relationTree[this.relationIndex];
            //počítá se dle délky pole +1!!
            this.relationIndex --;
            return (this.ruleController.ruleSelection(rule,ruleKey,this.selectedEl, undefined,undefined,this.queryTree));
        }

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


    getRelatedElements = (relation, key) =>
    {
        this.elementConsitencyTree = [];
        this.elementConsistencyIndex = 0;

        this.relationTreeIndex = 0; 
        this.relationTreeArr = [];

        let promiseArr = [];

        for (let el of relation[key])
        {
            promiseArr.push(this.rdfController.getRelationBTypes(el));
        }

        return Promise.all(promiseArr).then(result => {
            for (let i = 0; i < result.length; i++) {
                
                if (result[i].length > 0)
                {
                    result[i].unshift(this.getElementByUri(relation[key][i]));
                }
                else
                {
                   result[i] = [this.getElementByUri(relation[key][i])];
                }
            }
            
            return result; 
        })


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
        let returnEl;
        if (this.isElementUseless(this.relationTree[this.relationIndex]))
        {
            this.relationIndex --;
        }
        //ověření zda už nebyl element určen
        for (let index = 0; index < ontoModel.length; index ++) 
        {
            if (ontoModel[index].uri === this.relationTree[this.relationIndex].uri.value)
            {
                this.relationIndex --;
                index = 0;  
            }
            
        }  
        returnEl = this.relationTree[this.relationIndex];
        this.relationIndex --; 
        return returnEl;
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
    
    checkElementsConsistency = (relation,ruleKey) =>
    {
      
        let ontoModel = this.ontoController.getOntoModel();
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
        
        let relOntoType = this.ontoController.getOntoElement(this.relation.uri.value);
        let elementTypes = this.ruleController.elementConsistencyRules(this.elementConsitencyTree[this.elementConsistencyIndex],this.ontoController);
        //nejsem si jist druhou podmínkou ale 
        while (this.elementConsitencyTree.length < this.elementConsistencyIndex && elementTypes.length === 0)
        {
            this.elementConsistencyIndex ++; 
            elementTypes = this.ruleController.elementConsistencyRules(this.elementConsitencyTree[this.elementConsistencyIndex], this.ontoController);
        }

        return elementTypes; 
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

    checkDuplicity = (elName) => 
    {
        return this.ontoController.checkDuplicity(elName);
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

    setIndexexToDefault = () => 
    {      
        this.valuationArr = null;  

        this.relationRuleIndex = 0; 

        this.relationTree = {};
        this.relationTreeIndex = 0; 
        this.relationTreeArr =[];
        this.elementsWithoutType = [];
        this.withoutTypeIndex = 0; 

        this.elementConsistencyIndex = 0; 
        this.elementConsitencyTree = [];
    }
}




