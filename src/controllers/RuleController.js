import jsonData from './rules.json';
import RdfController from './RdfController.js';
import OntoModelController from './OntoModelController';
import ImageController from './ImageController';

// TODO -> v případě dvou otců projdi cyklem a zkontroluj oba!!!!
// TODO -> vyřešit vazby
// TODO -> next element do objektového schématu -> zatím prototyp 
// TODO -> třída element pro sjednocení properties 


export default class RuleController {
    constructor() {
        
        this.rulesJson = JSON.parse(JSON.stringify(jsonData));      
        this.rdfController = new RdfController(); 
        this.ontoController = new OntoModelController();  
        this.imageController = new ImageController();
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
        
        this.setIndexexToDefault();
    }
    
    getDefault = () =>
    {
     
        // tady se zeptej na type relationu 
        // tohle není do defaultu ale do next element
        // hod vyjmku v případě když nebude žádný relation k dispozici
        let relation = this.relations[this.relationOrderIndex];
        this.relation = relation;
        let result = this.rulesJson.bRelationRules[0].offer.map(function (ruleClass) {
            return {"name": ruleClass, "uri":relation.uri.value, "origin":"from"};
        }.bind(this));
     
        return {"buttons": result, "title": this.rulesJson.bRelationRules[0].question.replace("VAL",relation.label.value), "type": this.delUri(relation.type.value) };

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
        
        // Změnit!! 
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
                    result.push({"name":this.rulesJson.classes[val], "uri":element.uri.value, "origin": key}); 
                }
                return {"buttons": result, "title": element.label.value, type: "elementSelection"};
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

        //z elementu udělat otázku
        if (element !== false)
        {
            if (this.isElementInstace(element))
            {
                needElName =true;
                uri = element.uri.value;
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
            return {"name": ruleClass, "uri": uri ,"origin": key};
        }.bind(this));

        return Promise.resolve({"buttons": result, "title": question, "elName": needElName, "type": "classSelection"}); 
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

            if (!puroType.includes("ontoRelation"))
            {
               additionalRule = this.getAdditionalRule(this.getSpecificRule(this.rulesJson[this.relationType],ruleKey),selectedType);

               relationEl = this.ontoController.getRelationElements(elName, this.getElementByUri(selectedUri), selectedUri,this.relation.uri.value, additionalRule.length, this.relationRuleIndex, puroType, this.ontoUri, ruleKey);

               console.log("tady")
               console.log(relationEl)
               this.elSettings = {selectedType: selectedType, selectedUri: selectedUri, puroType: puroType, ruleKey:ruleKey, elName:elName, relationEl: relationEl, additionalRule: additionalRule, relType: ""};
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

      

            //Přidání do ontomodelu 
            this.ontoController.addToOntoModel(selectedUri, this.delUri(selectedUri),selectedType,
            this.delUri(this.selectedEl.type.value),this.relation.uri.value,ruleKey,undefined,undefined,elName);

            //vykreslení --> vrácení 
            
            //zjištění dodatečných pravide
           
            
            if (additionalRule.length > 0)
            {
                this.selectedEl = this.getNextElement;   
                console.log(additionalRule);
                //aditional rule 
                return Promise.resolve(this.ruleSelection(undefined,ruleKey,this.selectedEl,undefined,additionalRule));
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
                    
                    return Promise.resolve(this.commonRuleSelection(element, ruleKey)); 
                }
                else
                {
                    //projdi všechny elementy a ověř úplnost typů !!!!!!!!!!!!
                    //změnit strany případně nebo skočit na další relation!! jedeme dál..  
                    // this.relator rule.Key pro check elementů
                    let unfinishedTypes = this.checkElementsConsistency(this.relation.uri.value, ruleKey); 
                    if (unfinishedTypes.length > 0)
                    {
                
                        // upravit na funkci
                        let question = "What is " + unfinishedTypes[0].key + " of " + this.delUri(unfinishedTypes[0].element);
                        let mappedButtons = unfinishedTypes[0].types.map(function (ruleClass) {
                            return {"name": ruleClass, "uri": unfinishedTypes[0].element, "origin": ruleKey};
                        }.bind(this));

                        return Promise.resolve({"buttons": mappedButtons, "title": question, type: unfinishedTypes[0].key, "elName": true}); 
                               
                    }
                    else
                    {
                     
                        //projdi všechny již zvolené elementy v onto modelu a zkontroluj úplnost typů
                        //relationRuleIndex > 1 => další relation

                        
                        if (this.relationRuleIndex > 1)
                        {
                            //další relation!! 
                            this.setIndexexToDefault(); 

                            this.relationOrderIndex ++;

                            if (this.relationOrderIndex === this.relations.length)
                            {
                                alert("Transformation is comlete!!!");
                                return Promise.resolve({buttons: [], title: "The End"});
                            }
                            else
                            {
                                return Promise.resolve(this.getDefault());
                            }
                            
                        }
                        
                        //přepnutí na další větev

                        let lastElUri = this.ontoController.getLastElementUri(this.relation.uri.value);
                        this.ontoController.updateOntoModel(this.relation.uri.value, ruleKey, lastElUri);

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

    getGraphSvg = () =>
    {
      let ontoModel = this.ontoController.getOntoModel();
      let svg = this.imageController.createGraph(ontoModel);
      return svg; 
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

        
        if (relationFlow === "cardinality")
        {
            if ("fromT" in rule)
            {
                let fromB = rule.fromT.map(function (ruleClass) {
                    return {"name": ruleClass, "uri":elUri,"origin":ruleKey, direction: "from"};
                   }.bind(this));
                
                let toB = rule.fromT.map(function (ruleClass) {
                    return {"name": ruleClass, "uri":elUri,"origin":ruleKey, direction: "to"};
                }.bind(this));
    
                return {"buttons": toB.concat(fromB) , "title": "Vyber typ vztahu", "type": "ontoRelation-save"};
            }
            else
            {
                //ulož 
                alert(relType); 
                return true; 
            }

            
        }
        else if (relationFlow.includes("save"))
        {
            //ulož do modelu
            this.ontoController.addRelation(relOntoType, fromE, toE, "uriDomyslet", "nazev", elRelTypes[0], elRelTypes[1]);
            return true;
        }
        else
        {

           let result = rule.offer.map(function (ruleClass) {
            return {"name": ruleClass, "uri":elUri,"origin":ruleKey};
           }.bind(this));
           return {"buttons": result, "title": "Vyber typ vztahu", "type": "ontoRelation-cardinality"};

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
                    if (condition[index + 1] === ontoType)
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
       
        let elementTypes = this.elementConsistencyRules(this.elementConsitencyTree[this.elementConsistencyIndex],ontoModel);
        //nejsem si jist druhou podmínkou ale 
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
            let checkRelation = false;
            let ontoRel = this.ontoController.getOntoElement(this.relation.uri.value);

            //Tady by měla být pole jelikož to může být 1:N 
            // !!! Převod na metodu a úprava dle pravidel

            
            let subEl = this.ontoController.getElementsRelation(element.uri, "from");
            if (subEl.ontoType === "Relator")
            {
                subEl = subEl.uri;
            }
            else
            {
                if (subEl === false && ontoRel.to === "")
                {
                    subEl = this.relation.uri.value;
                
                }
                else
                {
                    subEl = subEl.to;
                }
            }
            

            let superEl = this.ontoController.getElementsRelation(element.uri, "to");
            if (superEl.ontoType === "Relator")
            {
                superEl = superEl.uri;
            }
            else
            {
                
                if (superEl === false && ontoRel.from === "")
                {
                     
                    superEl = this.relation.uri.value;
                
                }
                else
                {
                    superEl = superEl.from;
                }
            }

            let superElType = this.ontoController.getElementOntoType(superEl);
            let subElType = this.ontoController.getElementOntoType(subEl);
            console.log(superElType)
            console.log(subElType)
            for (let rule of rules)
            {
                if(rule.key === "superType")
                {
                     if (!rule.type.includes(superElType) && rule.type.length > 0)
                       {
                           
                           check.push({key: "superType", types: rule.type, element:element.uri});
                       }
                }
                else // subType
                {
                       if (!rule.type.includes(subElType) && rule.type.length > 0)
                       {
                           check.push({key: "subType", types: rule.type, element: element.uri});
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

        //this.ontoController.addToOntoModel(this.relation.uri.value, this.relation.label.value, selectedType, this.relation.type.value,
        //    this.relation.uri.value, undefined, this.relation.from.value, this.relation.to.value);

        this.ontoController.addRelation(selectedType, "" , "", this.relation.uri.value, this.relation.label.value);


        
        
        return new Promise(resolve => {relationTree.then(function(results) {


            results.unshift(this.getElementByUri(this.relation[ruleKey].value)); 
            this.relationTree = results; 
            this.relationIndex = this.relationTree.length - 1; 
            
            this.selectedEl = this.getNextElement();
            
            //rychlá záplata -> předělat
            let el = this.getElementByUri(this.selectedEl.uri.value)
            let additionalRule = [];
            if (el.father.length > 0)
            {
                let fatherType = this.ontoController.getElementOntoType(el.father[0]); 
                if (fatherType !== false)
                {
                   additionalRule = this.getAdditionalRule(this.getSpecificRule(rule,ruleKey),fatherType);
                }
            }
            if (additionalRule.length === 0)
            {
                resolve(this.ruleSelection(rule,ruleKey,this.selectedEl));
            }
            else
            {
              resolve(this.ruleSelection(undefined,ruleKey,this.selectedEl,undefined,additionalRule));
            }
            
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
        this.elementConsitencyTree = [];
        this.elementConsistencyIndex = 0;
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

    setIndexexToDefault = () => 
    {            
        this.relationRuleIndex = 0; 

        this.relationTree = {};
        this.relationTreeIndex = 0; 

        this.elementsWithoutType = [];
        this.withoutTypeIndex = 0; 

        this.elementConsistencyIndex = 0; 
        this.elementConsitencyTree = [];
    }
}




