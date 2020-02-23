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
            console.log(results);        
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
        console.log(this.queryTree);

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
            return this.createButtons(this.rulesJson.bRelationRules[0].offer, question,this.delUri(relation.type.value), false, relation.label.value)

            
        }
    }
    // předělat do objektů a metod-> sjednotit kód 
    //puroType createdClass 
    //ruleKey držet v property objektu 
    async nextElement (selectedType, selectedUri, puroType ,elName, nameWasChange) 
    {  


        console.log(this.relationTreeArr.length);
        console.log(this.relationTree);
        //první průchod na relataion
        console.log([selectedType, selectedUri, puroType ,elName, nameWasChange]);
      
        if (elName !== "" && nameWasChange === true)
        {
            this.changeElementsProperty(this.elementUri,"label", elName);
          
        } 
    
        if (puroType === "BRelation")
        {   
           return this.relationWasSelected(selectedType, this.ruleKey);
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
                    
                    this.setIndexexToDefault();
                    if (this.relation[this.ruleKey].length < this.branchIndex)
                    {
                        this.relationOrderIndex ++;
                        return this.getDefault();
                    } 
                    else
                    {
                        
                        this.nextTreeBranch(); 
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

            if (!puroType.includes("ontoRelation")  && puroType !== "dataType")
            {
               
               if (this.additionalRule.key === undefined)
               {
                additionalRule = this.ruleController.getAdditionalRule(this.ruleController.getSpecificRule(this.rulesJson[this.relationType],this.ruleKey,false, this.countBTypesInTree(this.relationTree)),selectedType, 1)
                if (additionalRule.length > 0)
                {
                    this.additionalRule.index = 2; 
                    this.additionalRule.rule =  this.ruleController.getSpecificRule(this.rulesJson[this.relationType],this.ruleKey,false, this.countBTypesInTree(this.relationTree));
                    this.additionalRule.key = selectedType;
                }
               } 
               else
               {
                 additionalRule = this.ruleController.getAdditionalRule(this.additionalRule.rule, this.additionalRule.key, this.additionalRule.index);
                 if (additionalRule.length > 0)
                 {

                    this.additionalRule.index ++; 
                 }
               }
 
               // Select Elements in relation
               //pokud se jedná o prázdný prvek 
               

               //Zjistí zda se jedná o konečný element

                
               //pocet kroku = pocet addRule
               const stepCount = this.ruleController.numberOfRuleStep( this.ontoController.getElementOntoType(this.relation.uri.value), this.ruleKey,this.countBTypesInTree(this.relationTree))
               
               const lastEl = (this.additionalRule.index > stepCount) || stepCount === 0 ? true : false; 
               
    
           
               
               relationEl = this.ontoController.getRelationElements(elName, this.getElementByUri(this.elementUri), this.elementUri,this.relation.uri.value, additionalRule.length, lastEl, puroType, this.ontoUri, this.ruleKey, nameWasChange);
  
 
               
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
                    return this.nextTreeBranch(this.ruleKey); 
                }
            }
            //Přidání do ontomodelu 
            const purType = this.selectedEl === false || !("type" in this.selectedEl) ? false : this.delUri(this.selectedEl.type.value);

           
            this.ontoController.addToOntoModel(this.elementUri, this.delUri(this.elementUri),selectedType,
            purType,this.relation.uri.value,this.ruleKey,undefined,undefined,elName, nameWasChange, this.ontoUri);
            
            //zjištění dodatečných pravide 
            if (additionalRule.length > 0)
            {
                this.selectedEl = this.getNextElement();
                
                this.elementUri = this.selectedEl === false ? "" : this.selectedEl.uri.value; 
                
                //kokoko
                
                //aditional rule
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
                    if (this.ontoController.getOntoElement(this.relation.uri.value).from === "")
                    {
                        const lastElUri = this.ontoController.getLastElementUri(this.relation.uri.value, this.ruleKey);
                        this.ontoController.updateOntoModel(this.relation.uri.value, this.ruleKey, lastElUri);
                    }
                    //projdi všechny elementy a ověř úplnost typů !!!!!!!!!!!!
                    //změnit strany případně nebo skočit na další relation!! jedeme dál..  
                    // this.relator rule.Key pro check elementů
                    
                    let unfinishedTypes = this.checkElementsConsistency(this.relation.uri.value, this.ruleKey); 
                    if (unfinishedTypes.length > 0)
                    {
                        // upravit na funkci
                       
                        const question = this.createQuestion(unfinishedTypes[0], this.rulesJson.questions); 
                        this.elementUri = unfinishedTypes[0].element; 
                        return this.createButtons(unfinishedTypes[0].types, question, unfinishedTypes[0].key,true);                               
                    }
                    else
                    {
                     
                        //projdi všechny již zvolené elementy v onto modelu a zkontroluj úplnost typů
                        //relsationRuleIndex > 1 => další relation
                        /*
                        if (this.relationRuleIndex > 1)
                        {
                            //další relation!! 
                            alert(this.relation[this.ruleKey].length)
                            alert(this.branchIndex)
   
                            if (this.relation[this.ruleKey].length < this.branchIndex)
                            {
                                alert("tady")
                                this.setIndexexToDefault();
                                this.relationOrderIndex ++;
                                return this.getDefault();
                            } 
                            else
                            {
                                alert("3333")
                                return this.nextTreeBranch(); 
                            }   
                        }
                        */
                        
                        //Doplň VALUE 
                        if (this.valuationArr === null)
                        {
                            this.valuationArr = this.getAllTreeValuations(this.ruleKey);
                            // vrat dotaz na Value
                            if (this.valuationArr.length > 0)
                            {
                               return this.handleValuation(); 
                            }
                        }
                        //přepnutí na další větev
                        //koks
                        if (this.relation[this.ruleKey].length === this.relationRuleIndex && this.ruleKey !== "from")
                        {
                            alert("tad2")
                            this.setIndexexToDefault();
                            this.relationOrderIndex ++;
                            return this.getDefault();
                        } 
                        else
                        {
                            alert("3333")
                            return this.nextTreeBranch(); 
                        }   
                    
                        return this.nextTreeBranch();
                    }
                }
            }

        }
            
    }

    updateRelationTypes ()
    {
        const ontoRel = this.ontoController.getOntoElement(this.relation.uri.value);
        

        if (ontoRel.to !== undefined && ontoRel.from !== undefined)
        {

            //koala
            if (ontoRel.ontoType === "Relator" && ontoRel.fromType === undefined)
            {
                const rule = this.ruleController.getSpecificRule(this.rulesJson[ontoRel.ontoType],"cardinality");
                return this.createRelCardinalityBtn("ontoRelation-save-bRelation-relator-from",rule,"from",ontoRel.from,ontoRel.uri);
            }
            else if (ontoRel.ontoType === "Relator" && ontoRel.toType === undefined) 
            {
                const rule = this.ruleController.getSpecificRule(this.rulesJson[ontoRel.ontoType],"cardinality");
                return this.createRelCardinalityBtn("ontoRelation-save-bRelation-relator-to",rule,"to",ontoRel.uri,ontoRel.to);
            }
            else if (ontoRel.toType === undefined && ontoRel.fromType === undefined )
            {
                const rule = this.ruleController.getSpecificRule(this.rulesJson[ontoRel.ontoType],"cardinality");
                return this.createRelCardinalityBtn("ontoRelation-save-bRelation",rule,"to",ontoRel.from,ontoRel.to);
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
      
       
        if (this.ontoController.getOntoElement(this.relation.uri.value).from === "")
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
        const labelFromE = this.getElementByUri(fromE) === false ? this.delUri(fromE) : this.getElementByUri(fromE).label.value;
        const labelToE = this.getElementByUri(toE) === false ? this.delUri(toE) : this.getElementByUri(toE).label.value ;
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

    handleRelatedElements (elements, origin, ruleKey, rule = this.rulesJson[this.relationType]) 
    {
       
        this.relationTreeArr = elements; 
        this.relationTree = elements[this.relationTreeIndex];
        this.relationTreeIndex ++; 
        this.relationIndex = this.relationTree.length - 1; 

        if (origin === "relationWasSelected" || this.ontoController.getOntoElement(this.relationTree[this.relationIndex].uri.value) !== false)
        {
            //koka

            const nextElement = this.getNextElement();
            
            let additionalRule = [];
            let fatherType = ""; 
            let el = false; 
            let bObjectChild = false;

            if (Array.isArray(nextElement) && nextElement[1] === false)
            {
                fatherType = this.ontoController.getElementOntoType(nextElement[0].uri.value); 
                if (nextElement[0].child.length > 0)
                {
                    
                    el = this.getElementByUri(nextElement[0].child[0]);
                    this.selectedEl = el;
                    bObjectChild = true;
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
                additionalRule = this.ruleController.getAdditionalRule(this.ruleController.getSpecificRule(rule,ruleKey, this.countBTypesInTree(this.relationTree)),fatherType, this.additionalRule.index);
                if (additionalRule.length > 0)
                {
                    
                    this.additionalRule.key = fatherType;
                    this.additionalRule.index ++;
                    this.additionalRule.rule = this.ruleController.getSpecificRule(rule,ruleKey, this.countBTypesInTree(this.relationTree));
                }
            }

            if (additionalRule.length === 0)
            {
                if (el === false && bObjectChild === true) 
                {
                    return this.nextTreeBranch();

                }
                else if (origin !== "relationWasSelected"  && bObjectChild === true)
                {
                    
                    //uprav vztah
                    //tady uprav poslední node ve větvi! -> vlož seller
                    let updateEl;
                    if(Array.isArray(nextElement))
                    {
                        updateEl = nextElement[0].uri.value;
                    }
                    else
                    {
                        updateEl = nextElement.uri.value; 
                    }
                    //kolo
                    
                    this.ontoController.updateOntoModel(this.relation.uri.value,ruleKey, updateEl);
                    
                    this.elementUri = updateEl; 

                    this.lastElInBranch = "cPhase";

                    return this.updateRelationTypes(); 
                    
                    this.setIndexexToDefault(); 
                    this.relationOrderIndex ++;
                    return this.getDefault();
                }
                else if (origin === "relationWasSelected" && bObjectChild === true )
                {
                   // diferent branch 
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

            // check if
            //podívej se jestli se nachází v onto modelu... 
            
            //počítá se dle délky pole +1!!
            this.relationIndex --;
    
            this.elementUri = this.selectedEl.uri.value;
        
            return (this.ruleController.ruleSelection(rule,ruleKey,this.selectedEl, this.ontoController.getLastElement(this.relation.uri.value, this.ruleKey).label,undefined,this.queryTree));
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
          
            for (let i = 0; i < result.length; i++) {
                if (result[i].length > 0)
                {
                    result[i].unshift(this.getElementByUri(relation[key][i]));
                    //doplnění prop u elementu
                    result[i] = result[i].map(el => el = this.getElementByUri(el.uri.value));
                }
                else
                {
                  
                   result[i] = [this.getElementByUri(relation[key][i])];
                }
            }

            console.log(result);
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
            if (ontoModel[index].uri === this.relationTree[this.relationIndex].uri.value)
            {
                //Check on another samples 
                if (this.areChildrenInBranchUseless(this.relationTree[this.relationIndex]))
                {
                 
                    //btype může jít do více realtionů
                    this.ontoController.addToProperty(ontoModel[index].uri, "fromRelation", this.relation.uri.value);
                    this.ontoController.addToProperty(ontoModel[index].uri, "direction", this.ruleKey);
                    return [this.relationTree[indexLastValue], false];  
                }
                this.relationIndex --;
                index = 0;  
            }
            
        }  
      
        returnEl = this.relationTree[this.relationIndex];
    
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
                if (node.fromRelation.includes(relation) && node.direction[node.direction.length - 1] === ruleKey)
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

        this.lastElInBranch = false; 


        this.additionalRule = {key: undefined, rule: {}, index: 1}; 
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




