import RdfController from './RdfController.js';
import OntoModelController from './OntoModelController';
import ImageController from './ImageController.js';
import RuleController from './RuleController.js';
import MainController from './MainController.js';
import HistoryController from './HistoryController.js';
import OntoSchmeController from './OntoSchemaController.js';

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
    
    getDefault (firstCall)
    {
        
        console.log(this.rdfController.getRelationBTypes("http://lod2-dev.vse.cz/data/puromodels#ticket"));
        // tady se zeptej na type relationu 
        // tohle není do defaultu ale do next element
        // hod vyjmku v případě když nebude žádný relation k dispozic
       
        if (this.relationOrderIndex === this.relations.length || this.relations.length === 0)
        {
            if (firstCall === true)
            {
                
                this.relationTree = this.queryTree;
            
                this.ruleKey = "from";
                this.elementUri = this.relationTree[this.relationOrderIndex].uri.value;
                this.relation = {uri:{value: null}};
                return this.ruleController.commonRuleSelection(this.relationTree[this.relationOrderIndex], true,this.ontoController.getOntoModel());
            }
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
            
            const question =this.getQuestion(relation.label.value, "bRelation");

            return this.createButtons(this.rulesJson.bRelationRules, question,this.delUri(relation.type.value), false, relation.label.value);            
        }
    }


    async nextElement (selectedType, selectedUri, puroType ,elName, nameWasChange) 
    {  
        let relationRules; 
        if (elName !== "" && nameWasChange === true)
        {
            this.changeElementsProperty(this.elementUri,"label", elName);
        } 
    
        if (puroType === "BRelation")
        {   
           
           return this.relationWasSelected(selectedType, elName);
        }
        else if (puroType === "needFather") 
        {
            if (selectedType.toLowerCase() === "none")
            {
                this.selectedEl["foundFather"] = selectedType.toLowerCase();
            }
            else
            {
                this.selectedEl["foundFather"] = this.ontoController.getElementByProperty("label",selectedType);
            }

            return  this.consistencyCheck(); 
        }
        else 
        {
            
            let relationEl; 
            let additionalRule = []; 
            let relFlow = puroType;
            let elRelTypes;
            
            if (puroType.includes("ontoRelation-save-bRelation") || puroType.includes("material") )
            {
                if(puroType.includes("relator"))
                {
                    let direction = puroType.replace("ontoRelation-save-bRelation-relator-","");
                    if(direction === "from")
                    {
                        this.ontoController.updateOntoModel(this.relation.uri.value,"fromType", selectedType);
                        relFlow = this.additionalRule.key === "last" ? "updated" : relFlow;
                    }
                    else if (direction === "to")
                    {
                        this.ontoController.updateOntoModel(this.relation.uri.value,"toType", selectedType);
                        relFlow = this.additionalRule.key === "last" ? "updated" : relFlow;
                    }
                    else if (direction === "material")
                    {
                       // select type 
                       // alert(selectedType)
                    }
                }
                else
                {     
                    this.ontoController.updateOntoModel(this.relation.uri.value,"fromType", selectedType[0]);
                    this.ontoController.updateOntoModel(this.relation.uri.value,"toType", selectedType[1]);
                    relFlow = this.additionalRule.key === "last" ? "updated" : relFlow;
                  
                }

                if (this.lastElInBranch === "cPhase-next")
                {
                   
                    return this.cPhaseHandle();
                }
                else
                {
                    if (Object.keys(this.elSettings).length === 0 && this.lastElInBranch === "cPhase")
                    {
                        const updateCardinality = this.updateRelationTypes();
                        if (updateCardinality !== false)
                        {
                            return updateCardinality; 
                        } 
                        else
                        {
                            return this.cPhaseHandle(); 
                        }

                    }
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
                this.elSettings.selectedType = selectedType; 
                const ontoRelation = this.ontoController.getOntoElement(this.relation.uri.value);
                this.additionalRule.key = "stop"; 
                if (ontoRelation[this.ruleKey].length !== this.relationRuleIndex)
                {

                    const lastElUri = this.ontoController.getLastElementUri(this.relation.uri.value,this.ruleKey);
            
                    this.ontoController.updateOntoModel(ontoRelation.uri, this.ruleKey,lastElUri);
                }
                const updateCardinality = this.updateRelationTypes();
                if (updateCardinality !== false)
                {
                    return updateCardinality; 
                } 
                this.consistencyExeption.push({uri: this.elementUri, ontoType:selectedType, type: puroType});
            
                return this.consistencyCheck(); 
            }
            
            if (!puroType.includes("ontoRelation")  && puroType !== "dataType")
            {
            //addRUleAsync

            
               if ((this.additionalRule.key!== "stop" && this.additionalRule.key === undefined && (this.additionalRule.index > 1 || this.ontoController.getOntoBranch(this.relation.uri.value,this.ruleKey, this.relationRuleIndex).length === 0)) && this.relation.uri.value !== null)
               {

                    additionalRule = this.ruleController.getAdditionalRule(this.ruleController.getSpecificRule(this.rulesJson[this.relationType],this.ruleKey,false, this.countBTypesInTree(this.relationTree)),selectedType, 1)
                    if (additionalRule.length > 0)
                    {
                        this.additionalRule.index = 2; 
                        this.additionalRule.rule =  this.ruleController.getSpecificRule(this.rulesJson[this.relationType],this.ruleKey,false, this.countBTypesInTree(this.relationTree));
                        this.additionalRule.key = selectedType;
                    }
               } 
               else if (this.additionalRule.index > 1 && this.additionalRule.key !== "stop")
               {
                 additionalRule = this.ruleController.getAdditionalRule(this.additionalRule.rule, selectedType, this.additionalRule.index);
                 if (additionalRule.length > 0)
                 {
                    this.additionalRule.index ++; 
                 }
                 else
                 {
                    this.additionalRule.key = "last";
                 }

               }
               
               const el = this.getElementByUri(this.elementUri);
               const isElInstance = el !== false && el.father.length > 0 ? this.isElementInstace(this.getElementByUri(el.father[0])): false ; 
               relationEl = this.ontoController.getRelationElements(elName,el , this.elementUri,this.relation.uri.value, additionalRule.length, additionalRule.length === 0, puroType, isElInstance, this.ruleKey, nameWasChange,this.relationRuleIndex);
               this.elSettings = {selectedType: selectedType, nameWasChange: nameWasChange, puroType: puroType, ruleKey:this.ruleKey, elName:elName, relationEl: relationEl, additionalRule: additionalRule, relType: "", elUri: this.elementUri};
            
               
            
               if ((relationEl === this.relation.uri.value) || this.lastElInBranch === "cPhase")
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
                

                this.ontoController.addToOntoModel(this.ontoUri+elName,elName,"Datatype","BValue",this.relation.uri,this.ruleKey, undefined,undefined,undefined,undefined,this.elementUri);
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
                this.elementUri = this.elSettings.elUri;
               
            } 
            relationRules = this.getRelationRules(relationEl, relFlow, selectedUri,this.ruleKey, this.elSettings.selectedType, this.elSettings.relType, elRelTypes);
         
            if (relationRules !== true)
            {
                //vrácení otázky v případě true relation ulož -> může se pokračovat
                return Promise.resolve(relationRules); 
            }
            
            if (this.valuationArr !== null)
            {
                //koks
                if (this.valuationArr.length > 0)
                {   

                    return this.handleValuation();
                
                }
                else if(this.valuationArr.length === 0)
                {
                   
                    if (this.ruleKey === "to" && this.relation.to.length === this.relationRuleIndex)
                    {
                        const ontoRel = this.ontoController.getOntoElement(this.relation.uri.value); 

                        if (this.updateRelationTypes() === false && ontoRel.from.length === ontoRel.to.length)
                        {
                            return this.cPhaseHandle();
                        }
                        else
                        {
                            const lastEl = this.ontoController.getLastElementUri(this.relation.uri.value, this.ruleKey);
                            this.ontoController.updateOntoModel(this.relation.uri.value,"to",lastEl);
    
                            this.elementUri = lastEl; 
                            this.lastElInBranch = "cPhase";
    
                            return this.updateRelationTypes();
                        }
                    }
                    else
                    {
                        return this.nextTreeBranch();
                    }
                }
            } 
            //Přidání do ontomodelu 
            const purType = this.selectedEl === false || !("type" in this.selectedEl) ? false : this.delUri(this.selectedEl.type.value);

            let origUri = undefined; 
            if (this.relationTree[this.relationTree.length - 1].uri.value === this.elementUri)
            {
               const ontoEl = this.ontoController.getOntoElement(this.elementUri); 
               if (ontoEl === false)
               {
                 origUri = "first"
               }    
            }

            //add element into onto model 
            this.ontoController.addToOntoModel(this.elementUri, this.delUri(this.elementUri),selectedType,
            purType,this.relation.uri.value,this.ruleKey,elName, nameWasChange, this.ontoUri, this.relationRuleIndex, origUri);
          
            
           
            //zjištění dodatečných pravide 
            if (additionalRule.length > 0)
            {
                this.selectedEl = this.getNextElement();
                console.log(this.selectedEl)
                this.elementUri = this.selectedEl === false || Array.isArray(this.selectedEl) ? "" : this.selectedEl.uri.value; 
                
                this.selectedEl = this.elementUri === "" ? false : this.selectedEl; 
                
                return this.ruleController.ruleSelection(undefined,this.ruleKey,this.selectedEl,this.ontoController.getLastElement(this.relation.uri.value, this.ruleKey).label,additionalRule,this.isElementInstace(this.getElementByUri(this.elementUri)), this.relation.label.value);
            }
            else if (this.additionalRule.key === "last")
            {   
                const ontoRelation = this.ontoController.getOntoElement(this.relation.uri.value);
                if (ontoRelation[this.ruleKey].length !== this.relationRuleIndex)
                {
                    const lastElUri = this.ontoController.getLastElementUri(this.relation.uri.value,this.ruleKey);
                    this.ontoController.updateOntoModel(ontoRelation.uri, this.ruleKey,lastElUri);
                }
                const updateCardinality = this.updateRelationTypes();
                if (updateCardinality !== false)
                {
                    //this.elSettings.selectedType = "none"
                    return updateCardinality; 
                } 
                else
                {
                   
                    this.additionalRule.key = "stop";
                    return this.consistencyCheck(); 
                }
            }
            else
            {
                
                this.additionalRule.key = "stop"; 
                

                // přiřazení typu neurčeným elementům 

                    if (this.relation.uri.value !== null && this.ontoController.getOntoElement(this.relation.uri.value).from.length === 0)
                    {
                        const lastElUri = this.ontoController.getLastElementUri(this.relation.uri.value, this.ruleKey);
                        this.ontoController.updateOntoModel(this.relation.uri.value, this.ruleKey, lastElUri);
                    }
            
                    return this.consistencyCheck();
                    
                
            }

        }
            
    }

    cPhaseHandle ()
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

    consistencyCheck ()
    {
       
        let next = this.selectedEl !== false && "foundFather" in this.selectedEl ? true : false;
        let addNone = false;
        if (this.elementsWithoutType.length === 0 || !next)
        {
            this.elementsWithoutType = this.checkElementsInRelationTree(this.relationTree,this.ontoController.getOntoModel());
        }     
       
        if ((this.elementsWithoutType.length > 0 && this.withoutTypeIndex < this.elementsWithoutType.length) || next)
        {        
           
            
            if (next === true && this.selectedEl["foundFather"] === "None")
            {
                this.withoutTypeIndex ++; 
            }

            const element = next ? this.selectedEl : this.getElementByUri(this.elementsWithoutType[this.withoutTypeIndex].uri.value);   

            if ("needToFindFather" in element && !next)
            {
                const relationEls = this.ontoController.getOntoBranch(this.relation.uri.value, this.ruleKey, this.relationRuleIndex); 
                if (relationEls.length < 2)
                {
                    element["foundFather"] = relationEls[0];
                    next = true; 
                    addNone = true;
                    
                }
                else
                {
                    const labels = []; 
                    const question = "To which element is " + element.label.value + " connected?"; 
                    this.selectedEl = element; 
    
                    for (let el of relationEls)
                    {
                        if (!labels.includes(el.label))
                        {
                            labels.push(el.label);
                        }
                    }
                    labels.push("None");
    
                    return this.createButtons(labels,question,"needFather", false, "")
                }

            }
            
            let commonRule = false;  
            if (element !== false)
            {   
                this.withoutTypeIndex ++;
                this.elementUri = element.uri.value;
            
                commonRule = this.ruleController.commonRuleSelection(element,this.getUsableFather(element),this.ruleKey,this.ontoController.getOntoModel(), next, addNone);
            }

            if (commonRule === undefined)
            {   
                alert("Common rule is not defined! Check rules.json");
                //window.location.reload();
            }
            else if (commonRule !== false)
            {
                this.selectedEl = {}; 
                
                return commonRule;
            }
        }

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
        else if (this.relation.uri.value === null)
        {
            return this.getDefault(); 
        }
        else
        {
            
            if (this.relation === null)
            {
                this.getDefault(); 
            }
            
            if (this.valuationArr === null && this.relationRuleIndex === 1)
            {
                this.valuationArr = this.getAllTreeValuations(this.ruleKey);
                if (this.valuationArr.length > 0)
                { 
                   return this.handleValuation(); 
                }
            }
            
            if (this.relation[this.ruleKey].length === this.relationRuleIndex && this.ruleKey !== "from")
            {
                const rel = this.ontoController.getOntoElement(this.relation.uri.value);

                if (rel.to.length < this.relationRuleIndex)
                {
                    const lastEl = this.ontoController.getLastElement(rel.uri,"to");
                    this.ontoController.updateOntoModel(rel.uri, "to", lastEl.uri);
                    this.lastElInBranch = "cPhase";

                    return this.updateRelationTypes(true); 
                }


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

    updateRelationTypes ()
    {
        const ontoRel = this.ontoController.getOntoElement(this.relation.uri.value);
        
        if (ontoRel.to.length > 0 && ontoRel.from.length > 0)
        {
           
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
       /*   else if (ontoRel.ontoType === "Relator" && !("materialExists" in ontoRel))
            {
                this.ontoController.addToProperty(ontoRel.uri,"materialExists", true); 
                return this.createButtons(["yes", "no"], "is there material","relator-material","sda","sdsad"); 
            } */
            else if (ontoRel.toType.length < ontoRel.to.length || ontoRel.fromType.length < ontoRel.from.length)
            {
                const rule = this.ruleController.getSpecificRule(this.rulesJson[ontoRel.ontoType],"cardinality");
                const ontoRelFromN = ontoRel.from.length <= ontoRel.fromType.length ? ontoRel.from.length - 1 :  ontoRel.fromType.length
                const ontoRelToN = ontoRel.to.length <= ontoRel.toType.length ? ontoRel.to.length - 1 :  ontoRel.toType.length
                return this.createRelCardinalityBtn("ontoRelation-save-bRelation",rule,"to",ontoRel.from[ontoRelFromN],ontoRel.to[ontoRelToN]);
            }
        }

        return false;
    }

    handleValuation () 
    {

        const question = this.getQuestion(this.delUri(this.valuationArr[0].valuation),"valuations"); 
        const buttons = this.createButtons(this.valuationArr[0].el, question, "dataType",true); 
        this.elementUri = this.valuationArr[0].valuation; 
        this.valuationArr.shift();
      //  if (this.valuationArr.length === 0) this.valuationArr = null; 

        return buttons;  
    }

    nextTreeBranch () 
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

        for (let index in valuations)
        {
            if (this.ontoController.getElementByProperty("origUri",valuations[index].valuation) !== false)
            {
                valuations.splice(index, 1);   
            }
        }

        return valuations; 
    }


    getGraphSvg  () 
    {
        let ontoModel = this.ontoController.getOntoModel();

        let svg = this.imageController.createGraph(ontoModel);
        return svg; 

    }
    
    createRelCardinalityBtn (type, rule, ruleKey, fromE, toE, relationFlow, elUri) 
    {
  
        type += (relationFlow === "dataType") ? "-daType" : ""; 
        
        let fromB = rule.fromT.map(ruleClass => {
            return {"name": ruleClass, "uri":elUri, direction: "from"};
            });
        
        let toB = rule.toT.map(ruleClass => {
            return {"name": ruleClass, "uri":elUri, direction: "to"};
        });

        const  labelFromE = this.selectElementsLabel(fromE);
        const labelToE = this.selectElementsLabel(toE);
        
        return {"buttons": toB.concat(fromB) , "title": "Select cardinality between elements", "type": type, "elName": [labelFromE, labelToE]};
    }

    selectElementsLabel(element)
    {
         let ontoEl = this.ontoController.getOntoElement(element);
         let label; 
         if (ontoEl === false)
         {
             if (element === this.elSettings.elUri)
             {
                label = this.elSettings.elName === "" ? this.delUri(element) : this.elSettings.elName; 
             }
             else
             {
                 label = this.delUri(element)
             }
         }
         else
         {
            label = ontoEl.label
         }


         return label; 
    }

    isCardinalityNeed (relType)
    {
        for (let rel of this.rulesJson.relations)
        {
             for (let key in rel)
             {
                 if (key === relType && "cardinality" in rel)
                 {
                    return rel["cardinality"]; 
                 }
             }
        }

        return true; 
    }
   
    getRelationRules  (elements, relType, elUri, ruleKey,ontoType, relOntoType, elRelTypes ) 
    {
       
        let fromE;
        let toE;

        let fromEType;
        let toEType; 

        let relationFlow = relType.replace("ontoRelation-", "");
        let rule;
        let relationRules = this.rulesJson.relationRules;  
        let createCardinality = true; 
 
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
            return true; 
        }
        
        if (relType === "updated")
        {
            return true;
        }
        if (rule === false && !relationFlow.includes("save"))
        {
            alert("Relation rule is not defined! Check rules.json!"); 
    
        }
        
        if (!relationFlow.includes("save") && (relationFlow === "cardinality" || relationFlow === "dataType" || rule.offer.length === 1))
        {
           
           
            // Vyhod chybu, že není definované pravidlo pro dva typy!! 
            if ("fromT" in rule && "toT" in rule && createCardinality === true && this.isCardinalityNeed(relOntoType))
            {
            
                this.elSettings.relType = (rule.offer.length === 1) ? rule.offer[0] : this.elSettings.relType ;   
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
            this.ontoController.addRelation(this.elSettings.relType, fromE, toE, undefined, "nazev", elRelTypes[0], elRelTypes[1]);
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

    relationWasSelected (selectedType, elName) 
    {
        
        this.ruleKey = "from";
        this.relation = this.relations[this.relationOrderIndex];
        this.relationType = selectedType; 
        elName = elName === "" ? this.relation.label.value : elName;
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

        
        this.ontoController.addRelation(selectedType, "" , "", this.relation.uri.value, elName);
  
        return new Promise(resolve => {relationTreePromise.then(results => {
            // resilts "relationWasSelected"
            
            resolve (this.handleRelatedElements(results,"relationWasSelected", this.ruleKey, rule));

         });});
    }

    handleRelatedElements (elements, origin, ruleKey, rule) 
    {


        rule = rule === undefined ? this.rulesJson[this.relationType] : rule;
        this.relationTreeArr = elements; 
        this.relationTree = elements[this.relationTreeIndex];
        // tohle do if když to poleze na next element 
        this.relationTreeIndex ++; 
        this.relationIndex = this.relationTree.length - 1;        
        
        this.debug(this.relationTree, "tree")
    
        if (origin === "relationWasSelected" || this.ontoController.getOntoElement(this.relationTree[this.relationIndex].uri.value) !== false)
        {
            // tady if a rozrad to dle vstupu
         
            const nextElement = this.getNextElement();
            
            // tady dopln všechny nadřazené entity aby byly updatovány na stejný relation
            let additionalRule = [];
            let fatherType = ""; 
            let el = false; 
            let bObjectChild = false;
            let prevEl = false; 
            let lastEl = null;
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
        
                if (this.selectedEl !== false)
                {
                    el = this.getElementByUri(this.selectedEl.uri.value);
                    if (el.father.length > 0)
                    {
                      fatherType = this.ontoController.getElementOntoType(el.father[0]); 
                      prevEl = this.ontoController.getOntoElement(el.father[0]);
                    }
                }

            }
    
            if (fatherType !== "" && fatherType !== false)
            {                
                const elements = this.ontoController.getElementsFromBranch(prevEl.uri);
         
                let addIndex = 1; 
                let prevAdd = []; 
                for (let index in elements)
                {
                    let node = this.ontoController.getOntoElement(elements[index]);
                    if (node.origUri === "first")
                    {
                        elements.length = parseInt(index) + parseInt(1); 
                        break;
                    }
                }

                for (let index = elements.length - 1; index >= 0; index--) {
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
                      
                        if (prevAdd.includes(element.ontoType))
                        {
                            additionalRule = []; 
                            break; 
                        }
                        else
                        {
                            lastEl = element; 
                            this.additionalRule.key = fatherType;
                            additionalRule = prevAdd; 
                            break; 
                        }

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
                if (origin !== "relationWasSelected")
                {

                    //uprav vztah
                    //tady uprav poslední node ve větvi! -> vlož seller
                  
                    this.ontoController.updateOntoModel(this.relation.uri.value,ruleKey, prevEl.uri);

                    this.elementUri = prevEl.uri; 

                    this.lastElInBranch = "cPhase";
    
                    return this.updateRelationTypes(true); 
                    
                }
                else if (origin === "relationWasSelected" && (bObjectChild === true || prevEl !== false))
                {
                   // diferent branch
              
                   this.ontoController.updateOntoModel(this.relation.uri.value,ruleKey, prevEl.uri);
                   return this.nextTreeBranch(); 
                }
                else
                {
                    this.elementUri = this.selectedEl === false || Object.keys(this.selectedEl).length === 0 ? "" : this.selectedEl.uri.value; 
                    return this.ruleController.ruleSelection(rule,ruleKey,el,this.ontoController.getLastElement(this.relation.uri.value, this.ruleKey).label,undefined,this.isElementInstace(el), this.relation.label.value,this.countBTypesInTree(this.relationTree));
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
                let lastLabel; 
                if (lastEl !== null)
                {
                    this.elementUri = lastEl.uri;
                    lastLabel = lastEl.label;
                }
                else
                {
                    lastLabel = prevEl.label;
                }
                
                return  this.ruleController.ruleSelection(undefined,ruleKey,el,lastLabel,additionalRule,this.isElementInstace(el), this.relation.label.value);
            }
        }
        else
        {
            const rule = this.rulesJson[this.relationType];
            
            //Zkontroluj zda element useless a jaký typ!!! 
            this.selectedEl = this.relationTree[this.relationIndex];

            // check if
            //podívej se jestli se nachází v onto modelu... 
            
            //počítá se dle délky pole +1!!
            this.relationIndex --;
    
            this.elementUri = this.selectedEl.uri.value;

            return (this.ruleController.ruleSelection(rule,ruleKey,this.selectedEl, this.ontoController.getLastElement(this.relation.uri.value, this.ruleKey).label,undefined,this.isElementInstace(this.selectedEl), this.relation.label.value,this.countBTypesInTree(this.relationTree)));
        }

    }

    deleteDuplicityInRelTree (dupArray)
    {
        let checkArr = dupArray;
        for (let node of this.relationTree)
        {
            for (let child of dupArray)
            {
                if (node.uri.value === child)
                {
                    checkArr = checkArr.filter(e => e !== child); 
                }
            }
        }

        return checkArr;
    }

    isInAnohterRelation (element)
    {
       let lastChild = null; 
       while (element.connect.length === 0 && element.connectFrom.length === 0 && element.child.length > 0 )
       {
         for (let child of element.child)
         {
            child = this.getElementByUri(child);

            if(!this.isElementInstace(child)) 
            {
                element = child; 
                break; 
            }
            else if (element.child[element.child.length - 1] === child.uri.value && child.child.length ===  0 && this.isElementInstace(child))
            {
                lastChild = child; 
            }
         }

         if (lastChild !== null) 
         {
             element = lastChild;
             break; 
         }

       }

       if ((element.connectFrom.includes(this.relation.uri.value) || element.connect.includes(this.relation.uri.value)) || (element.child.length === 0 && element.connectFrom.length === 0 && element.connect.length === 0))
       {
           return false;
       }
       else
       {
           return true; 
       }
    }

    getElementsWithoutType (element, elWithoutType)
    {
        const currEl = this.getElementByUri(element.uri.value);
        if (currEl.child.length > 0)
        {   
            
            for (let child of currEl.child)
            {
                const childEl = this.getElementByUri(child); 
                if ((!this.isElementInstace(childEl) || (childEl.child.length > 1)) && this.ontoController.getOntoElement(childEl.uri.value) === false && !this.isInAnohterRelation(childEl))
                { 
                    if (!childEl.fatherTypeRelation.includes("http://lod2-dev.vse.cz/ontology/puro#instanceOf"))
                    {   
                        elWithoutType.push(childEl);
                    }
                    else
                    {
                       
                        const checkArr = this.deleteDuplicityInRelTree(childEl.child);

                        if (checkArr.length > 0)
                        {
                            for (let uri of checkArr)
                            {
                              
                                const el = this.getElementByUri(uri); 
                                let fatherWithouType = this.getUsableFather(el); 
                                fatherWithouType = this.deleteDuplicityInRelTree(fatherWithouType);
                                for (let i in fatherWithouType)
                                {
                                    fatherWithouType[i] = this.getElementByUri(fatherWithouType[i]);
                                    fatherWithouType[i]["needToFindFather"] = true; 
                                }
                                
                                elWithoutType = elWithoutType.concat(fatherWithouType);
                            }
                        }

                        
                    }
        
                    elWithoutType = this.getElementsWithoutType(childEl,elWithoutType);
                }

            }
        }
        return elWithoutType; 
    }

    checkElementsInRelationTree (tree) 
    {
        let elementsWithoutType = [];
        // let withoutType = true; 
        for (let element of tree)
        {
            //element s definovaným type   
            elementsWithoutType = this.getElementsWithoutType(element, elementsWithoutType); 



            // withoutType = true;
              /*
            for (let node of ontoModel)
            {
                if(element.uri.value === node.uri)
                {
                 
                    withoutType = false;
                }
            }
          
            if (withoutType === true && (!this.isElementUseless(element) || this.relation.uri.value === null) && !this.isElementInstace(element))
            {
                alert(element.uri.value + " SSSSSS")
                elementsWithoutType.push(element); 
            }
            */
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
   
    }

    
    getNextElement () 
    {
        if(this.relationIndex < 0)
        {
            return false; 
        }

        const ontoModel = this.ontoController.getOntoModel();
        let returnEl;
        if (this.isElementUseless(this.relationTree[this.relationIndex]) && this.isElementInstace(this.relationTree[this.relationIndex]))
        {
            this.relationIndex --;
        }
        
     
        for (let index = 0; index < ontoModel.length; index ++) 
        {
           
            if (this.relationTree[this.relationIndex] !== undefined && ontoModel[index].uri === this.relationTree[this.relationIndex].uri.value)
            {
                
                if (this.isRelationShareType(this.getElementByUri(this.relationTree[this.relationIndex].uri.value),this.relation.uri.value,this.relationType))
                {
                    const ontoElement = this.ontoController.getOntoElement(this.relationTree[this.relationIndex].uri.value);
                    
                    this.ontoController.addToProperty(ontoElement.uri, "fromRelation", this.relation.uri.value);
                    this.ontoController.addToProperty(ontoElement.uri, "direction", this.ruleKey);
                    
                    return [ontoElement, false]; 
                }
                else if (this.areChildrenInBranchUseless(this.relationTree[this.relationIndex]))
                {
                    const lastRel = ontoModel[index].fromRelation[ontoModel[index].fromRelation.length - 1]; 
                    let lastDirection = ontoModel[index].direction[ontoModel[index].direction.length - 1]; 

                    // na toto pozor projdi testováním
                    if (ontoModel[index].fromRelation.length > 1 && ontoModel[index].fromRelation[ontoModel[index].fromRelation.length - 1] === ontoModel[index].fromRelation[ontoModel[index].fromRelation.length - 2])
                    {
                        lastDirection = this.getOpositeDirection(lastDirection)
                    }

                    
                    let lastElement = this.ontoController.getLastElementUri(lastRel,lastDirection, undefined ,this.relation.uri);  
                    
            
                    while (this.ontoController.getCardinalElement(lastElement, false) !== false)
                    {
                        lastElement = this.ontoController.getCardinalElement(lastElement,false);
                    }
                   
                    lastElement = this.ontoController.getElementInRelRow(lastElement);
            
                    lastElement = this.ontoController.getOntoElement(lastElement);

                    const allBranchBtypes = this.ontoController.getOntoBranch(lastRel, lastDirection); 
         
                    
                    for (let el of allBranchBtypes)
                    {
                        
                        this.ontoController.addToProperty(el.uri, "fromRelation", this.relation.uri.value);
                        this.ontoController.addToProperty(el.uri, "direction", this.ruleKey);
                    }
                    
                    return [lastElement, false];  
                }
                else
                {
                    this.relationIndex --;
                    index = 0;  
                    
                }

            }
            
        }  
    
        returnEl = this.relationTree[this.relationIndex];

        returnEl = returnEl === undefined ? false : returnEl;
        this.relationIndex --; 
        return returnEl;
    }

    isRelationShareType (el, currentRelation, direction)
    {
        const ontoEl = this.ontoController.getOntoElement(el.uri.value) 
        if (ontoEl === false || !ontoEl.fromRelation.includes(currentRelation)) return false;

        direction = direction === "from"? "connect" : "connectFrom"; 
        
        let result = [];

        result = this.getConnectRelation(el,direction,currentRelation, result); 

        if (result.includes(true))
        {
            return true; 
        }
        else
        {
            return false;
        }

    }

    getConnectRelation (el, direction, currentRelation, result)
    {
        for (let child of el.child)
        {
            let childEl = this.getElementByUri(child);
            if (childEl[direction].includes(currentRelation))
            {
                result.push(true); 
                break; 
            }
            else if (childEl.child.length > 0)
            {
              this.getConnectRelation(childEl,direction,currentRelation, result); 
            }
        }
        
        return result; 
    }

    areChildrenInBranchUseless (element)
    {
        if (element.childRel.includes("http://lod2-dev.vse.cz/ontology/puro#subTypeOf") && this.relationTree.length > 1)
        {
           return false;
        }

        return true; 
    }

    isElementInstace (element) 
    {
        if (typeof element !== "object") return false;  

        for (let node of this.queryTree)
        {
            if (element.uri.value === node.uri.value  )
            {
                for (let type of node.fatherTypeRelation)
                {
                    if (this.delUri(type) === "instanceOf" || this.delUri(type) === "Some_objects")
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
        //tady se to může projet od začátku do konce zas tolik to nevádí :) 
        let ontoModel = this.ontoController.getOntoModel();
        let consistencyIndex = 0; 
        const consistencyTree = []; 

        for (let node of ontoModel)
        {
            if (node.fromRelation.includes(relation) && node.direction[node.direction.length - 1] === ruleKey && node.branchIndex.includes(this.relationRuleIndex))
            {
            
                consistencyTree.push(node); 
            }
        }

   
       
        if (consistencyTree.length === 0)
        {
            return consistencyTree; 
        }
        
        let elementTypes = this.ruleController.elementConsistencyRules(consistencyTree[consistencyIndex],this.ontoController);
        //nejsem si jist druhou podmínkou ale 
        
        consistencyIndex ++;


        while (consistencyIndex < consistencyTree.length && elementTypes.length === 0)
        {
            
            elementTypes = this.ruleController.elementConsistencyRules(consistencyTree[consistencyIndex], this.ontoController);
            consistencyIndex ++; 
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
        if (typeof uri !== "string") return false; 

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
                else if (typeof record[key] === "object")
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
            this.relationRuleIndex = 0; 
            this.relation = {};
            this.relationIndex = 0; 
            this.relationType = ""; 
            return false; 
        }
        this.ontoController.undo(history.ontoModel);

        console.log(JSON.parse(JSON.stringify(this.additionalRule)))
        for (let prop in history.properties)
        {
            if (typeof history.properties[prop] === "object")
            {
                console.log(prop)
                console.log(JSON.parse(JSON.stringify(this[prop])))
                this[prop] = JSON.parse(JSON.stringify(history.properties[prop]))
                
            }
            else
            {
                this[prop] = history.properties[prop]; 
            }
            
        }
        console.log(JSON.parse(JSON.stringify(this.additionalRule)))
        return {inputVariables: history.inputVariables};
    }

    getOntoSchema ()
    {
        return this.ontoSchemaController.transform(this.ontoController.getOntoModel());
    }

    getIframeURL ()
    {

        return this.rulesJson["iframeURL"].replace("MODELID",this.modelId); 
    }

    fullSizeSvg ()
    {
        let index = 0; 
       
        for (let node of this.ontoController.getOntoModel())
        {
            if (node.type === "Class")
            {
                index ++; 
            }
            
            if (index === 4)
            {
                return true;
            }
        }
        return false; 
    }

    getUsableFather (element)
    {
        //doporučuji napojení na druhého otce
        const returnArr = []; 
        for (let node of element.father)
        {
            let father = this.getElementByUri(node);
            if (this.isElementInstace(father) === false) returnArr.push(father.uri.value); 

            while (this.isElementInstace(father))
            {
           
                for (let fatherOfFather of father.father)
                {
              
                    father = this.getElementByUri(fatherOfFather);
                    if (this.isElementInstace(father) === false)
                    {
                   
                        returnArr.push(father.uri.value); 
                    }
                }

                if (returnArr.length > 0) break; 
            }


        }
        element.father = returnArr; 
        return returnArr;
    }

}




