import MainController from "./MainController";

export default class RuleController extends MainController {
    

    //ruleSelection queryTree, 
    ruleSelection = (rules, key, element, previousElName, rule, queryTree) => 
    {
        
        let commands; 
        let additionalRules;
        let offerTypes;
        let uri;
        let question;
        let needElName;
        let elName = "";
        
        if (rule)
        {
            offerTypes = rule; 
        }
        else
        {
            commands = this.getSpecificRule(rules,key);
            //additionalRules = this.getAdditionalRule(commands,ontoType);
            //offerTypes = (additionalRules.length > 0 ) ? offerTypes = additionalRules : offerTypes = commands.offer;
            offerTypes = commands.offer   
        }

        //z elementu udělat otázku
        if (element !== false)
        {
            if (this.isElementInstace(element,queryTree))
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
                elName = element.label.value; 
            }
        }
        else
        {
            //zjisti zda je chyby nebno ne 
            needElName = true;

            //Třeba dodělat Replace!!

            for (let q of this.rulesJson.questions)
            {
                if (q.type === "bTypeChild")
                {
                    question = q.question.replace("VAL", previousElName);
                    break;
                }
            }
        }
       
        return this.createButtons(offerTypes,question, "classSelection",needElName,elName);
    }

    isElementInstace = (element, queryTree) =>
    {
        for (let node of queryTree)
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

    // this.ontoController.getOntoElement(this.relation.uri.value);
    elementConsistencyRules = (element,  ontoController) => 
    {

            // v případě undefinied vyhoď, že pravidlo není definováno 
            let rules = this.rulesJson[element.ontoType]; 
           
            let check = []; 
            let addRule; 
            

            //Tady by měla být pole jelikož to může být 1:N 
            // !!! Převod na metodu a úprava dle pravidel
            // udělat connect -> subtype -> supertype jenom v případě arrow 

            let elTypes = {
                superType: ontoController.getRelatedTypes(element.uri,"to", "Generalization"), 
                subType: ontoController.getRelatedTypes(element.uri,"from","Generalization"), 
                connect: ontoController.getRelatedTypes(element.uri, "connect", false)
            };
            console.log(elTypes)
            for (let rule of rules)
            {
                check = this.elementConsistencySelection(rule,elTypes.connect,"connect",element,check,rules,elTypes);
                check = this.elementConsistencySelection(rule,elTypes.superType,"superType",element,check,rules,elTypes);
                check = this.elementConsistencySelection(rule,elTypes.subType,"subType",element,check,rules,elTypes);
            }

            addRule = this.getSpecificRule(rules,"connected"); 
            if (addRule !== false)
            {
                
            }
            //Kontrola none a spojených typů!! 
         
            return check;
    }



    elementConsistencySelection = (rule,elTypes,key,element,check,rules,allTypes) =>
    {
        if(rule.key === key)
        {
                if (!rule.type.some(r=> elTypes.includes(r)) && rule.type.length > 0 )
                {
                    // if includes none -> zkontrolovat lenght superType -> zeptat se jestli chci doplnit superType -> nabídnout co je v tabulce -> zkontrolovat jestli už není
                    check.push({key: key, types: rule.type, element:element.uri, rule:rule});
                }
                else 
                {
                    const additionalRules =  this.getSpecificRule(rules, key + "ed", true);
                    if (additionalRules !== false)
                    {
                        for (let addRule of additionalRules)
                        {
                            if (addRule.type.some(r=> elTypes.includes(r))) {
                                check = this.elementConsAddSelection("superType",addRule,elTypes,check,element,allTypes);
                                check = this.elementConsAddSelection("subType",addRule,elTypes,check,element,allTypes);
                                check = this.elementConsAddSelection("connect",addRule,elTypes,check,element,allTypes);
                            }
                        }
                    }
                }

        }
        return check; 
    }
    
    elementConsAddSelection (type, rule, elTypes, check, element, allTypes)
    {
        if (type in rule)
        {
            if (!rule[type].some(r=> allTypes[type].includes(r)) && rule[type].length > 0 )
            {
                check.push({key: type, types: rule[type], element:element.uri, rule:rule});
            }
        }
        return check; 
    }

    numberOfRuleStep (relationType, key, bTypeNumber)
    {
        const rule = this.getSpecificRule(this.rulesJson[relationType], key, false, bTypeNumber);
        let indexCount = 0; 

        for (let key in rule)
        {
            if (!isNaN(key))
            {
                indexCount ++; 
            }
        }

        return indexCount; 
    }

    getSpecificRule = (rules, key, moreThanOne = false, bTypeNumber = false) =>
    {
        let addRules = [];
        
        
        if (bTypeNumber !== false)
        {
            for (let node of rules)
            {
                if (node.key === key &&  ("bTypeNumber" in node) && node.bTypeNumber.includes(bTypeNumber))
                {
                    if (moreThanOne === true)
                    {
                        addRules.push(node);
                    }
                    else
                    {   
                        return node; 
                    }   
                }
            }
        }
        


        for (let node of rules)
        {
         
            if (node.key === key)
            {
                if (moreThanOne === true)
                {
                    addRules.push(node);
                }
                else
                {   
                    return node; 
                }   
            }
        }

        // Tady možná hvězda 

        if (addRules.length > 0)
        {
            return rules;
        }
        else
        {
            return false; 
        }     
    }



    getAdditionalRule = (rule, selectedType, index) =>
    {
        /*
        if (selectedType in rule)
        {
            alert("bam")
            console.log(rule)
            return rule[selectedType];
        }
        else
        {
            return [];
        }
        */
        if (rule !== false && index.toString() in rule && selectedType in rule[index])
        {
            console.log(rule[index][selectedType])
            return rule[index][selectedType]; 
        }
        
        return [];
    
    }


    commonRuleSelection = (element, key, ontoModel) => 
    {
        let result = [];

        // tohle vyřeš na úrovni onto modelu!
        let fatherOnto = [];
        let childPuroType = [];
        const connection =  element.connect.length > 0 ? true : false;  
   
        for (let child of element.childType)
        {
            childPuroType.push(this.delUri(child));
        }

        
        for (let node of ontoModel)
        {
            if (element.father.includes(node.uri)) {
                fatherOnto.push(node.ontoType);
            }
            
        }
  
        // Změnit!! 
        for (let rule of this.rulesJson.commonRules)
        {

            /*if ((fatherOnto.includes(rule.fatherOnto) || (fatherOnto.length === 0 && rule.fatherOnto === "")) &&
                (fatherPuro.includes(rule.fatherPuro) || (fatherPuro.length === 0 && rule.fatherPuro === "")) &&
                childPuro.includes(rule.childPuro) || childPuro === rule.childPuro &&
                rule.hasRelation <= connection
                )
            */
           if ((fatherOnto.some(r=> rule.fatherOnto.includes(r)) || (rule.fatherOnto.includes("none"))) &&
            (connection === rule.connection || rule.connection === 0) && (element.childType.some(r=> rule.childPuro.includes(r) || 
            (rule.childPuro.includes("none"))) 
           ))
            {

                const question = "Which type is "+element.label.value+"?";
                return this.createButtons(rule.offer,question, "elementSelection",false, element.label.value);
            }
        }
    }



}