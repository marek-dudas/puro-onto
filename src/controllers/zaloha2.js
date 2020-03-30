import RdfController from './RdfController.js';
import OntoModelController from './OntoModelController';
import ImageController from './ImageController.js';
import RuleController from './RuleController.js';
import MainController from './MainController.js';
import HistoryController from './HistoryController.js';
import OntoSchmeController from './OntoSchemaController.js';

//chyba nejspíše bude v RDF!! v relationTree je instance v případě prvního XML tam instance není, history of dogs je smazané, tak udělej příklad s tím!!!
// TODO -> v případě dvou otců projdi cyklem a zkontroluj oba!!!!
// TODO -> vyřešit vazby
// TODO -> next element do objektového schématu -> zatím prototyp 
// TODO -> třída element pro sjednocení properties 
// UNDO 


//dodělat duplicity 
//zkontrolovat na onto 3


export default class EventController extends MainController{
    constructor() {
        super();   
        this.rdfController = new RdfController(); 
        this.ontoController = new OntoModelController();  
        this.imageController = new ImageController();
        this.ruleController = new RuleController();
        this.historyController = new HistoryController();
        this.ontoSchemaController = new OntoSchmeController(); 
        const queryTreePromise = this.rdfController.getFullPath();
        
        queryTreePromise.then(results => {
            this.queryTree = results;   
            console.log(results);        
        });
        
        const relationsPromise = this.rdfController.getRelations();
        relationsPromise.then(results => {
            this.relations = results;          
        });

                     
        


        this.elSettings = {};
        // Nový začátek 

        this.relationOrderIndex = 0;
        this.relation = {};
        this.relationIndex = 0; 
        this.relationType = ""; 
        
        this.setIndexexToDefault();

    }
    
    getDefault ()
    {
        
        // tady se zeptej na type relationu 
        // tohle není do defaultu ale do next element
        // hod vyjmku v případě když nebude žádný relation k dispozic
        if (this.relationOrderIndex === this.relations.length)
        {
            alert("Transformation is comlete!!!");
            return {buttons: [], title: "The End", type: "end"};
        }

        const relation = this.relations[this.relationOrderIndex];
        this.relation = relation;
        this.ruleKey = "from";

        if(this.relation.valuation.length > 0)
        {
           
            //return this.nextElement("Relator",this.relation.uri.value,"BRelation","from");
            const question = relation.label.value.charAt(0).toUpperCase() + relation.label.value.slice(1) + " was typed as a Relator."
            return this.createButtons("Relator",question,this.delUri(relation.type.value),false,relation.label.value);
        }
        else
        {
            //this.elUri = relation.uri.value;
            this.elementUri = relation.uri.value;
            
            const question = this.rulesJson.bRelationRules[0].question.replace("VAL",relation.label.value);
            return this.createButtons(this.rulesJson.bRelationRules[0].offer, question,this.delUri(relation.type.value), false, relation.label.value);            
        }
    }


    async nextElement (selectedType, selectedUri, puroType ,elName, nameWasChange) 
    {  

        if (elName !== "" && nameWasChange === true)
        {
            this.changeElementsProperty(this.elementUri,"label", elName);
        } 
    
        if (puroType === "BRelation")
        {   
           return this.relationWasSelected(selectedType, this.ruleKey);
        }
        else if (puroType === "nextBranchElements")
        {
            const foundEl = this.ontoController.getElementByLabel(selectedType); 

            return this.handleRelatedElements (this.handleInput[0], this.handleInput[1], this.handleInput[2], this.handleInput[3],foundEl) 
        }
        else 
        {
            
            let relationEl; 
            let additionalRule = []; 
            let relFlow = puroType;
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

                if (this.lastElInBranch === "cPhase-next")
                {
                   
                    if (this.relation[this.ruleKey].length <= this.relationRuleIndex)
                    {

                        this.relationOrderIndex ++;
                        this.setIndexexToDefault();
                        return this.getDefault();
                    } 
                    else
                    {
                        return this.nextTreeBranch(); 
                    }
                }
                else
                {
                    selectedType = this.elSettings.selectedType;
                    puroType = this.elSettings.puroType;
                    elName = this.elSettings.elName;
                    relationEl = this.elSettings.relationEl;
                    additionalRule = this.elSettings.additionalRule; 
                    nameWasChange = this.elSettings.nameWasChange;
                }

            }
            
            if (!Array.isArray(selectedType) && selectedType.toLowerCase() === "none")
            { 
                this.consistencyExeption.push({uri: this.elementUri, ontoType:selectedType, type: puroType});
                return this.consistencyCheck(); 
            }
            
            if (!puroType.includes("ontoRelation")  && puroType !== "dataType")
            {
               
               if (this.additionalRule.key === undefined && (this.additionalRule.index > 1 || this.ontoController.getOntoBranch(this.relation.uri.value,this.ruleKey).length !== 1))
               {
                additionalRule = this.ruleController.getAdditionalRule(this.ruleController.getSpecificRule(this.rulesJson[this.relationType],this.ruleKey,false, this.countBTypesInTree(this.relationTree)),selectedType, 1)
                if (additionalRule.length > 0)
                {
                    this.additionalRule.index = 2; 
                    this.additionalRule.rule =  this.ruleController.getSpecificRule(this.rulesJson[this.relationType],this.ruleKey,false, this.countBTypesInTree(this.relationTree));
                    this.additionalRule.key = selectedType;
                }
               } 
               else if (this.additionalRule.index > 1)
               {
                 additionalRule = this.ruleController.getAdditionalRule(this.additionalRule.rule, this.additionalRule.key, this.additionalRule.index);
                 if (additionalRule.length > 0)
                 {

                    this.additionalRule.index ++; 
                 }
               }
          
               relationEl = this.ontoController.getRelationElements(elName, this.getElementByUri(this.elementUri), this.elementUri,this.relation.uri.value, additionalRule.length, additionalRule.length === 0, puroType, this.ontoUri, this.ruleKey, nameWasChange,this.relationRuleIndex > 1);
                              
               this.elSettings = {selectedType: selectedType, nameWasChange: nameWasChange, puroType: puroType, ruleKey:this.ruleKey, elName:elName, relationEl: relationEl, additionalRule: additionalRule, relType: ""};
                            
               if (relationEl === this.relation.uri.value || this.lastElInBranch === "cPhase")
               {
                 const updateRelTypes = this.updateRelationTypes();
                 if (updateRelTypes !== false)
                 {
                     this.lastElInBranch += "-next"; 
                     return updateRelTypes;
                 }
               }
            }
            else if(puroType === "dataType")
            {
                relationEl = [selectedType, this.ontoUri+elName];
                this.elSettings.relationEl = relationEl;
                this.elSettings.relType = "connect" // rovná čára mezi elementy 
                this.ontoController.addToOntoModel(this.ontoUri+elName,elName,"Datatype","BValue",this.relation.uri,this.ruleKey);
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
                puroType = this.elSettings.puroType;
                elName = this.elSettings.elName;
                relationEl = this.elSettings.relationEl;
                additionalRule = this.elSettings.additionalRule; 
                nameWasChange = this.elSettings.nameWasChange;
            } 
            
            const relationRules = this.getRelationRules(relationEl, relFlow, selectedUri,this.ruleKey, this.elSettings.selectedType, this.elSettings.relType, elRelTypes);
          
            if (relationRules !== true)
            {
                //vrácení otázky v případě true relation ulož -> může se pokračovat
                return Promise.resolve(relationRules); 
            }
            if (this.valuationArr !== null)
            {
               
                if (this.valuationArr.length > 0)
                {
                    return this.handleValuation(); 
                }
                else if(this.valuationArr.length === 0)
                {
                   
                    if (this.ruleKey === "to" && this.relation.to.length === this.relationRuleIndex)
                    {
                        const lastEl = this.ontoController.getLastElementUri(this.relation.uri.value, this.ruleKey);
                        this.ontoController.updateOntoModel(this.relation.uri.value,"to",lastEl);

                        this.elementUri = lastEl; 
                        this.lastElInBranch = "cPhase";

                        return this.updateRelationTypes();
                    }
                    else
                    {
                        return this.nextTreeBranch();
                    }
                }
            } 
            //Přidání do ontomodelu 
            const purType = this.selectedEl === false || !("type" in this.selectedEl) ? false : this.delUri(this.selectedEl.type.value);

            this.ontoController.addToOntoModel(this.elementUri, this.delUri(this.elementUri),selectedType,
            purType,this.relation.uri.value,this.ruleKey,undefined,undefined,elName, nameWasChange, this.ontoUri, this.relationRuleIndex);
          
            //zjištění dodatečných pravide 
            if (additionalRule.length > 0)
            {
                this.selectedEl = this.getNextElement();
        
                this.elementUri = this.selectedEl === false ? "" : this.selectedEl.uri.value; 
                

                return this.ruleController.ruleSelection(undefined,this.ruleKey,this.selectedEl,this.ontoController.getLastElement(this.relation.uri.value, this.ruleKey).label,additionalRule,this.queryTree);
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
                    const element = this.getElementByUri(this.elementsWithoutType[this.withoutTypeIndex].uri.value);
                    
                    this.withoutTypeIndex ++;
                    
                    this.elementUri = element.uri.value;

                    return this.ruleController.commonRuleSelection(element, this.ruleKey,this.ontoController.getOntoModel()); 
                }
                else
                {
                    if (this.ontoController.getOntoElement(this.relation.uri.value).from.length === 0)
                    {
                    
                        const lastElUri = this.ontoController.getLastElementUri(this.relation.uri.value, this.ruleKey);
                        this.ontoController.updateOntoModel(this.relation.uri.value, this.ruleKey, lastElUri);
                    }
                    //projdi všechny elementy a ověř úplnost typů !!!!!!!!!!!!
                    //změnit strany případně nebo skočit na další relation!! jedeme dál..  
                    // this.relator rule.Key pro check elementů
                    return this.consistencyCheck();
                    
                }
            }
        }
    }


    consistencyCheck ()
    {
        let unfinishedTypes = this.checkElementsConsistency(this.relation.uri.value, this.ruleKey); 
                    
        if (unfinishedTypes.length > 0)
        {              
            for (let exeption of this.consistencyExeption)
            {
                for (let index in unfinishedTypes)
                {
                    
                    if(exeption.uri === unfinishedTypes[index].element && unfinishedTypes[index].types.includes(exeption.ontoType) && exeption.type === unfinishedTypes[index].key)
                    {
                        unfinishedTypes.splice(index, 1);
                    }
                }
            }

    
            if ((unfinishedTypes.length > 0 && unfinishedTypes[0].types.includes("Relator") && unfinishedTypes[0].types.includes("None")) || (unfinishedTypes.length > 0 && unfinishedTypes[0].types.includes("None") && unfinishedTypes[0].types.length === 1))
            {
                unfinishedTypes.splice(0, 1);  
            }
        }
        
        if (unfinishedTypes.length > 0)
        {
            const question = this.createQuestion(unfinishedTypes[0], this.rulesJson.questions); 
            this.elementUri = unfinishedTypes[0].element;
            return this.createButtons(unfinishedTypes[0].types, question, unfinishedTypes[0].key,true);                               
        }
        else
        {   
            if (this.valuationArr === null && this.relationRuleIndex === 1)
            {
                this.valuationArr = this.getAllTreeValuations(this.ruleKey);
                // vrat dotaz na Value
                if (this.valuationArr.length > 0)
                {
                    return this.handleValuation(); 
                }
            }
            if (this.relation[this.ruleKey].length === this.relationRuleIndex && this.ruleKey !== "from")
            {
                this.setIndexexToDefault();
                this.relationOrderIndex ++;
                return this.getDefault();
            } 
            else
            {
                
                return this.nextTreeBranch(); 
            }   
    
        }
    }

    updateRelationTypes (end)
    {
        const ontoRel = this.ontoController.getOntoElement(this.relation.uri.value);

        console.log(ontoRel)
        if (ontoRel.to.length > 0 && ontoRel.from.length > 0)
        {
            console.log(ontoRel)
            if (ontoRel.ontoType === "Relator" && ontoRel.fromType.length < ontoRel.from.length)
            {
                
                const rule = this.ruleController.getSpecificRule(this.rulesJson[ontoRel.ontoType],"cardinality");
                return this.createRelCardinalityBtn("ontoRelation-save-bRelation-relator-from",rule,"from",ontoRel.from[ontoRel.fromType.length],ontoRel.uri);
            }
            else if (ontoRel.ontoType === "Relator" && ontoRel.toType.length < ontoRel.to.length) 
            {
                const rule = this.ruleController.getSpecificRule(this.rulesJson[ontoRel.ontoType],"cardinality");
                return this.createRelCardinalityBtn("ontoRelation-save-bRelation-relator-to",rule,"to",ontoRel.uri,ontoRel.to[ontoRel.toType.length]);
            }
            else if (ontoRel.toType.length < ontoRel.to.length && ontoRel.fromType.length < ontoRel.from.length)
            {
                const rule = this.ruleController.getSpecificRule(this.rulesJson[ontoRel.ontoType],"cardinality");
                return this.createRelCardinalityBtn("ontoRelation-save-bRelation",rule,"to",ontoRel.from[ontoRel.fromType.length],ontoRel.to[ontoRel.toType.length]);
            }
        }

        return false;
    }

    handleValuation () 
    {
        const question = "Which Datatype represents " + this.delUri(this.valuationArr[0].valuation) + "?"; 
        const buttons = this.createButtons(this.valuationArr[0].el, question, "dataType",true); 
        this.elementUri = this.valuationArr[0].valuation; 
        this.valuationArr.shift();
        return buttons;  
    }

    nextTreeBranch () 
    {
        
      
        if (this.ontoController.getOntoElement(this.relation.uri.value).from.length === 0 || (this.relationRuleIndex > 1 && this.ruleKey === "from"))
        {
            let lastElUri = this.ontoController.getLastElementUri(this.relation.uri.value, this.ruleKey);
            this.ontoController.updateOntoModel(this.relation.uri.value, this.ruleKey, lastElUri);
        }
        
        

        let relationTypePromise; 

        //number of branches -> uprav 
        if (this.relationTreeIndex === this.relationTreeArr.length)
        {
            if (this.relation[this.ruleKey].length === this.relationRuleIndex)
            {
               this.ruleKey = this.ruleKey === "from" ? "to": "from"; 
               this.relationRuleIndex = 0;
            }   
            
            relationTypePromise = this.getRelatedElements(this.relation,this.ruleKey);
            this.relationRuleIndex ++; 
        }
        else
        {   
            relationTypePromise = Promise.resolve(this.relationTreeArr);
        }

        this.additionalRule.key = undefined;
        this.additionalRule.index = 0; 
        this.consistencyExeption = [];


        return new Promise(resolve => {relationTypePromise.then((results) => {
            this.valuationArr = null;
            resolve (this.handleRelatedElements(results,"nextElement",this.ruleKey ))
        });});
    }

    getAllTreeValuations (ruleKey)
    {
        let valuations = [];
        for(let treeEl of this.relationTree)
        {
          
            let el = this.getElementByUri(treeEl.uri.value);
            if (el.valuation.length > 0)
            {
                let connectElement = el.uri.value; 
                if (this.delUri(el.type.value) === "BObject" || el.fatherTypeRelation.includes("http://lod2-dev.vse.cz/ontology/puro#instanceOf"))
                {
                    const lastTypes = this.rulesJson["lastTypes"];
                    let lastEl = [];
                    for (let type of lastTypes)
                    {
                      lastEl = lastEl.concat(this.ontoController.getElementsByOntoType(type, this.relation.uri.value));
                    }
                    if (lastEl.length > 0) {
                        connectElement = lastEl[0]; 
                    }
                }

                for (let valuation of el.valuation)
                {
                    valuations.push({el: connectElement, valuation: valuation})
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


    getGraphSvg  () 
    {
      let ontoModel = this.ontoController.getOntoModel();
      //const lastEl = this.ontoController.getOntoElement(this.ontoController.getLastElementUri());

        let svg = this.imageController.createGraph(ontoModel);
        return svg; 

    }
    
    createRelCardinalityBtn (type, rule, ruleKey, fromE, toE, relationFlow, elUri) 
    {

        type += (relationFlow === "dataType") ? "-daType" : ""; 
        let fromB = rule.fromT.map(ruleClass => {
            return {"name": ruleClass, "uri":elUri,"origin":ruleKey, direction: "from"};
            });
        
        let toB = rule.fromT.map(ruleClass => {
            return {"name": ruleClass, "uri":elUri,"origin":ruleKey, direction: "to"};
        });
        const labelFromE = this.ontoController.getOntoElement(fromE) === false ? this.delUri(fromE) : this.ontoController.getOntoElement(fromE).label;
        const labelToE = this.ontoController.getOntoElement(toE) === false ? this.delUri(toE) : this.ontoController.getOntoElement(toE).label ;
        return {"buttons": toB.concat(fromB) , "title": "Select cardinality between elements", "type": type, "elName": [labelFromE, labelToE]};
    }

    getRelationRules  (elements, relType, elUri, ruleKey,ontoType, relOntoType, elRelTypes ) 
    {
        
        //type save relation - type -> podradnost -> ulozeni 
        // this.relationType = definice type 
        // 
        
    

        let fromE;
        let toE;

        let fromEType;
        let toEType; 

        let relationFlow = relType.replace("ontoRelation", "");
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
            //Poupraví se již vytvořený element 
            return true; 
        }

        if (rule === false)
        {
            alert("Relation rule is not defined! Check rules.json!"); 
    
        }
        
        if ((relationFlow === "cardinality" || relationFlow === "dataType" || rule.offer.length === 1) && !relationFlow.includes("save"))
        {
           

            // Vyhod chybu, že není definované pravidlo pro dva typy!! 
            if ("fromT" in rule && "toT" in rule)
            {
                
                this.elSettings.selectedType = (rule.offer.length === 1) ? rule.offer[0] : this.elSettings.selectedType ;   
                return this.createRelCardinalityBtn("ontoRelation-save",rule,ruleKey,fromE,toE,relationFlow,elUri);
            }
            else
            { 
                
                relOntoType = (rule.offer.length === 1) ? rule.offer[0] : relOntoType; 
                this.ontoController.addRelation(relOntoType, fromE, toE, undefined, "nazev", "", "");

                return true;
            }

            
        }
        else if (relationFlow.includes("save"))
        {
            //ulož do model
            this.ontoController.addRelation(relOntoType, fromE, toE, undefined, "nazev", elRelTypes[0], elRelTypes[1]);
            
            return true;
        }
        else
        {

           let result = rule.offer.map((ruleClass) => {
            return {"name": ruleClass, "uri":elUri,"origin":ruleKey};
           });

           this.elementUri = elUri;

           return {"buttons": result, "title": "Which type of relation is between "+ this.delUri(fromE) +" and " + this.delUri(toE)+"?", "type": "ontoRelation-cardinality"};        
        
        }

    }

    findRule (rules, condition) 
    {
        let validity = false;  
        for (let rule of rules)
        {
            validity = false;
            for (let index = 0; index < condition.length; index += 2 ) 
            {  
                for (let ontoType of rule[condition[index]])
                {
                    if (this.isSameCaseInsensitive(condition[index + 1],ontoType) || ontoType === "*")
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

    relationWasSelected (selectedType) 
    {
        
        this.ruleKey = "from";
        this.relation = this.relations[this.relationOrderIndex];
        this.relationType = selectedType; 
        //selected type do object property
        
        let rule = this.rulesJson[selectedType];
        let relationTreePromise;
        
        if(this.relationTreeArr.length === this.relationTreeIndex)
        {
            relationTreePromise = this.getRelatedElements(this.relation,this.ruleKey);
        }
        else
        {
            relationTreePromise = Promise.resolve(this.relationTreeArr);
        }
        
        
        this.relationRuleIndex ++; 

        //this.ontoController.addToOntoModel(this.relation.uri.value, this.relation.label.value, selectedType, this.relation.type.value,
        //    this.relation.uri.value, undefined, this.relation.from.value, this.relation.to.value);

        this.ontoController.addRelation(selectedType, "" , "", this.relation.uri.value, this.relation.label.value);

      
        
        return new Promise(resolve => {relationTreePromise.then(results => {
            resolve (this.handleRelatedElements(results,"relationWasSelected", this.ruleKey, rule));

         });});
    }

    handleRelatedElements (elements, origin, ruleKey, rule, endElement) 
    {
        
        rule = rule === undefined ? this.rulesJson[this.relationType] : rule;
        this.handleInput = []; 
        let conectedEl; 
      
        if (endElement === undefined)
        {
            this.relationTreeArr = elements; 
            this.relationTree = elements[this.relationTreeIndex];
            this.relationTreeIndex ++; 
            this.relationIndex = this.relationTree.length - 1; 
            let keyDirection;

            if (origin === "relationWasSelected")
            {
                keyDirection = ruleKey;
            }
            else
            {
                keyDirection = ruleKey === "from" ? "to" : "from"; 
            }
            const question =  "To which element is the " + this.delUri(this.relationTree[this.relationIndex].uri.value) + " connected?";
            conectedEl = this.ontoController.connectToBranchElement(this.relation.uri.value,keyDirection);
            if (conectedEl !== false)
            {
                
                

                this.handleInput = [elements, origin, ruleKey, rule]; 
                return this.createButtons([conectedEl[0].label, conectedEl[1].label],question, "nextBranchElements", false, "");
            }
        }



        if (origin === "relationWasSelected" || this.ontoController.getOntoElement(this.relationTree[this.relationIndex].uri.value) !== false)
        {
            //kopo
 
            let nextElement; 

            if (conectedEl === false)
            {
                nextElement = this.getNextElement();
            }
            else 
            {
                nextElement = [conectedEl, false]
            }
            
            
     
            let additionalRule = [];
            let fatherType = ""; 
            let el = false; 
            let bObjectChild = false;
            let prevEl = false; 
            
            if (Array.isArray(nextElement) && nextElement[1] === false)
            {
               
                prevEl = nextElement[0]; 
                fatherType = nextElement[0].ontoType; 
                const rdfEl = this.getElementByUri(nextElement[0].uri); 
                
                if (rdfEl !== false && rdfEl.child.length > 0)
                {
                    
                    el = this.getElementByUri(rdfEl.child[0]);
                    this.selectedEl = el;
                    bObjectChild = true;
                }
                this.ontoController.updateOntoModel(nextElement[0].uri,"branchIndex",this.relationRuleIndex,false);
               
                if ((this.relationRuleIndex > 1 || prevEl.fromRelation.length > 0) && !this.additionalRule.index > 0)
                {
                    this.additionalRule.index ++; 
                }
            }
            else
            {
                this.selectedEl = nextElement; 
                el = this.getElementByUri(this.selectedEl.uri.value);
                if (el.father.length > 0)
                {
                  fatherType = this.ontoController.getElementOntoType(el.father[0]); 
                }
            }
            
            if (fatherType !== "" && fatherType !== false)
            {
                // vrat poradi elementu ve větvi projdi add rule vrat!! 
                // last 
                
                const elements = this.ontoController.getElementsFromBranch(prevEl.uri);
               
                let addIndex = 1; 
                let prevAdd = []; 

                for (let index = elements.length - 1; index >= elements.length -1; index--) {
                    let element = this.ontoController.getOntoElement(elements[index])
                    additionalRule = this.ruleController.getAdditionalRule(this.ruleController.getSpecificRule(this.rulesJson[this.relationType],this.ruleKey,false, this.countBTypesInTree(this.relationTree)),element.ontoType, addIndex);
                    
               
                    if (additionalRule.length > 0)
                    {
                        prevAdd = additionalRule;
                        this.additionalRule.index ++;
                        addIndex = this.additionalRule.index;
                    }
                    else
                    {   
                        
                        this.additionalRule.key = fatherType;
                        additionalRule = prevAdd; 
                        break; 
                    }

                    if (index === elements.length - 1)
                    {
                        this.additionalRule.key = fatherType;
                        additionalRule = prevAdd; 
                    }
                }

                if (additionalRule.length > 0)
                {
                    this.additionalRule.rule = this.ruleController.getSpecificRule(rule,ruleKey, this.countBTypesInTree(this.relationTree));
                }
            }
          
            if (additionalRule.length === 0)
            {
                if (el === false && bObjectChild === true) 
                {
                    return this.nextTreeBranch();
                }
                if (origin !== "relationWasSelected"  && bObjectChild === true)
                {   
                    this.ontoController.updateOntoModel(this.relation.uri.value,ruleKey, prevEl.uri);

                    this.elementUri = prevEl.uri; 

                    this.lastElInBranch = "cPhase";

                    return this.updateRelationTypes(true); 
                    
                }
                else if (origin === "relationWasSelected" && (bObjectChild === true || prevEl !== false))
                {
                   // diferent branch f
                  
                   this.ontoController.updateOntoModel(this.relation.uri.value,ruleKey, prevEl.uri);
                   return this.nextTreeBranch(); 
                }
                else
                {
         
                    this.elementUri = this.selectedEl.uri.value;
                    return this.ruleController.ruleSelection(rule,ruleKey,el,this.ontoController.getLastElement(this.relation.uri.value, this.ruleKey).label,undefined,this.queryTree);
                }

            }
            else
            {  
                //selectUridle
                if (el !== false)
                {
                    this.elementUri = this.selectedEl.uri.value;
                }
                else
                {
                    this.elementUri = "";
                }
                
                return  this.ruleController.ruleSelection(undefined,ruleKey,el,this.ontoController.getLastElement(this.relation.uri.value, this.ruleKey).label,additionalRule,this.queryTree);
            }
        }
        else
        {
            const rule = this.rulesJson[this.relationType];
            
            //Zkontroluj zda element useless a jaký typ!!! 
            this.selectedEl = this.relationTree[this.relationIndex];
            
            //koko
            this.relationIndex --;
    
            this.elementUri = this.selectedEl.uri.value;
        
            return (this.ruleController.ruleSelection(rule,this.ruleKey,this.selectedEl, this.ontoController.getLastElement(this.relation.uri.value, this.ruleKey).label,undefined,this.queryTree));
        }

    }


    checkElementsInRelationTree (tree, ontoModel) 
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


    getRelatedElements (relation, key) 
    {

        this.elementConsitencyTree = [];
        this.elementConsistencyIndex = 0;

        this.relationTreeIndex = 0; 
        this.relationTreeArr = [];

        let promiseArr = [];
        
      
        promiseArr.push(this.rdfController.getRelationBTypes(relation[key][this.relationRuleIndex]));


        return Promise.all(promiseArr).then(result => {
            console.log(result)
            for (let i = 0; i < result.length; i++) {
                if (result[i].length > 0)
                {
                    result[i].unshift(this.getElementByUri(relation[key][this.relationRuleIndex-1]));
                    //doplnění prop u elementu
                    result[i] = result[i].map(el => el = this.getElementByUri(el.uri.value));
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



    l (m2)
    {
        console.log("CECKKKKKKKKKKKKKKKKKKKKK");
        console.log(m2);
    } 


    
    getNextElement () 
    {
        //koko
 
        if(this.relationIndex < 0)
        {
            return false; 
        }

        const ontoModel = this.ontoController.getOntoModel();
        let returnEl;
        if (this.isElementUseless(this.relationTree[this.relationIndex]))
        {
            this.relationIndex --;
        }
        const  indexLastValue = this.relationIndex; 
        //ověření zda už nebyl element určen
    
        for (let index = 0; index < ontoModel.length; index ++) 
        {
            if (this.relationTree[this.relationIndex] !== undefined && ontoModel[index].uri === this.relationTree[this.relationIndex].uri.value)
            {
                //Check on another samples 
                if (this.areChildrenInBranchUseless(this.relationTree[this.relationIndex]))
                {
                    const lastRel = ontoModel[index].fromRelation[ontoModel[index].fromRelation.length - 1]; 
                    const lastDirection = ontoModel[index].direction[ontoModel[index].direction.length - 1]; 
                    
                    let lastElement = this.ontoController.getLastElementUri(lastRel,lastDirection);  
                    
                    while (this.ontoController.getCardinalElement(lastElement, false) !== false)
                    {
                        lastElement = this.ontoController.getCardinalElement(lastElement,false);
                    }
                    
                    lastElement = this.ontoController.getOntoElement(lastElement);



                    const allBranchBtypes = this.ontoController.getOntoBranch(lastRel, lastDirection)
                
                    //btype může jít do více realtionů
                    for (let el of allBranchBtypes)
                    {
                        this.ontoController.addToProperty(el.uri, "fromRelation", this.relation.uri.value);
                        this.ontoController.addToProperty(el.uri, "direction", this.ruleKey);
                    }
                
                    return [lastElement, false];  
                }
                this.relationIndex --;
                index = 0;  
            }
            
        }  
      
        returnEl = this.relationTree[this.relationIndex];
        
        returnEl = returnEl === undefined ? false : returnEl;
        this.relationIndex --; 
        return returnEl;
    }

    areChildrenInBranchUseless (element)
    {
        if (element.childRel.includes("http://lod2-dev.vse.cz/ontology/puro#subTypeOf"))
        {
           return false;
        }

        return true; 
    }

    isElementInstace (element) 
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
    
    checkElementsConsistency  (relation,ruleKey) 
    {
        
        let ontoModel = this.ontoController.getOntoModel();
        if (this.elementConsitencyTree.length === 0)
        {
            for (let node of ontoModel)
            {
                if (node.fromRelation.includes(relation) && node.direction[node.direction.length - 1] === ruleKey && node.branchIndex.includes(this.relationRuleIndex))
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
    isElementUseless (element) 
    {
      
        if ('child' in element) {
            if (element.child.length === 0 && element.connect.length === 0 && element.connectFrom.length === 0)
            {       
               
                return true; 
            }
        } 
        return false; 
    }

    getElementByUri (uri) 
    {
        for (let node of this.queryTree)
        {
            if (node.uri.value === uri) {
                return node; 
            }
        }
        return false; 
    }

    changeElementsProperty (uri, property, value)
    {
        for (let i = 0; i < this.queryTree.length; i++) {
            if (this.queryTree[i].uri.value === uri)
            {
                this.queryTree[i][property].value = value;
                return true; 
            }
        }
        return false; 
    }

    checkDuplicity (elName) 
    {
        return this.ontoController.checkDuplicity(elName);
    }
     
    getConnectedElements (rule, elements) 
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

    setIndexexToDefault  ()  
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

        this.elementUri = "";
        this.ruleKey = "";
        this.type = "";


        this.selectedEl = {};
        this.elSettings = {};

        this.handleInput = [];

        this.lastElInBranch = false; 


        this.additionalRule = {key: undefined, rule: {}, index: 1}; 

        this.consistencyExeption = []; 
        // Nový začátek 

    }

    saveHistory (record, inputVariables)
    {
        if (this.historyController.propertiesHistory.length === 0)
        {
            let initRec = {};
            for (let key in record) 
            {
                if (record[key] === "queryTree")
                {
                    initRec[key] = JSON.parse(JSON.stringify(this.queryTree));
                }
                else if (typeof record[key] === "string")
                {
                    initRec[key] = ""; 
                }
                else if (typeof record[key] === "number") 
                {
                    initRec[key] = 0;
                }
                else if (Array.isArray(record[key]))
                {
                    initRec[key] = []
                }
                else if (record[key] === "object")
                {
                    initRec[key] = {}
                }
            }
            this.historyController.init(initRec);
        }


        this.historyController.saveRecords(record,JSON.parse(JSON.stringify(this.ontoController.getOntoModel())), inputVariables);
    }
  
    undo()
    {
        const history = this.historyController.undo(); 


        if (history.ontoModel === undefined && history.properties === undefined)
        {
            this.historyController.reset();
            this.ontoController.undo([]);
            this.setIndexexToDefault();
            this.elSettings = {};
            this.relationOrderIndex = 0;
            this.relation = {};
            this.relationIndex = 0; 
            this.relationType = ""; 
            return false; 
        }
        this.ontoController.undo(history.ontoModel);

        for (let prop in history.properties)
        {
            if (typeof history.properties[prop] === "object")
            {
        
                this[prop] = JSON.parse(JSON.stringify(history.properties[prop]))
                
            }
            else
            {
                this[prop] = history.properties[prop]; 
            }
            
        }
        return {inputVariables: history.inputVariables};
    }

    getOntoSchema ()
    {
        return this.ontoSchemaController.transform(this.ontoController.getOntoModel());
    }

}




