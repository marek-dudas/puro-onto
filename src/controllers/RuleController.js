import MainController from "./MainController";

export default class RuleController extends MainController {
    

    //ruleSelection queryTree, 
    ruleSelection = (rules, key, element, previousElName, rule, queryTree, relationLabel) => 
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
            let additionalQuestion = "";
            
            if (element.connect.length > 1)
            { 
                additionalQuestion = "\n " + this.getQuestion(relationLabel, "relSpecific");
            }
            
            if (this.isElementInstace(element,queryTree))
            {
                needElName =true;
                uri = element.uri.value;



                question = this.rulesJson.questions[1].question.replace("VAL",element.label.value) + additionalQuestion;
            }
            else
            {
                needElName = false;
                uri = element.uri.value;
                question = this.rulesJson.questions[0].question.replace("VAL",element.label.value) + additionalQuestion;
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

    moreThanOneRule (ontoController, element,minCount,maxCount, check)
    {
        const elInRelation = ontoController.getElementInRelation(element.uri,"*","from",false)[0]; 
        const childrenCount = ontoController.getElementInRelation(elInRelation.element.uri,elInRelation.relationType,"to", element.ontoType).length;
        if (childrenCount < maxCount)
        {
            const types = childrenCount < minCount ? [element.ontoType] : [element.ontoType, "None"]
            check.push({key: "subType", types: types, element: elInRelation.element.uri, rule:{type:[element.ontoType],question:this.getQuestion(elInRelation.element,"moreThanOne")}}); 
        }

        return check; 

    }

    // this.ontoController.getOntoElement(this.relation.uri.value);
    elementConsistencyRules = (element,  ontoController) => 
    {
            // v případě undefinied vyhoď, že pravidlo není definováno 
            let rules = this.rulesJson[element.ontoType];    
            let check = []; 
        
       

            //Tady by měla být pole jelikož to může být 1:N 
            // !!! Převod na metodu a úprava dle pravidel
            // udělat connect -> subtype -> supertype jenom v případě arrow 

            let elTypes = {
                superType: ontoController.getRelatedTypes(element.uri,"to", "Generalization"), 
                subType: ontoController.getRelatedTypes(element.uri,"from","Generalization"), 
                connect: ontoController.getRelatedTypes(element.uri, "connect", false)
            };

            console.log (elTypes.connect)
            
            for (let rule of rules)
            {
             
                check = this.elementConsistencySelection(rule,elTypes.connect,"connect",element,check,rules,elTypes, ontoController);
                check = this.elementConsistencySelection(rule,elTypes.superType,"superType",element,check,rules,elTypes,ontoController);
                check = this.elementConsistencySelection(rule,elTypes.subType,"subType",element,check,rules,elTypes, ontoController);
                if (rule.key === "moreThanOne")
                {
                    check = this.moreThanOneRule(ontoController,element,rule.minCount,rule.maxCount,check);
                }
            }

            //Kontrola none a spojených typů!! 

            if ((check.length > 0 && check[0].types.includes("Relator") && check[0].types.includes("None")))
            {
                check.splice(0, 1);  
            }

            for (let i = 0; i < check.length; i++) {
                check[i]["elLabel"] =  ontoController.getOntoElement(check[i].element).label;  
            }



            return check;
    }



    elementConsistencySelection = (rule,elTypes,key,element,check,rules,allTypes, ontoController) =>
    {
        if(rule.key === key)
        {
                
                const suffix = key[key.length - 1] === "e" ? "d" : "ed";
                const additionalRules =  this.getSpecificRule(rules, key + suffix, true);
                if (!rule.type.some(r=> elTypes.includes(r)) && rule.type.length > 0 )
                {
                    // if includes none -> zkontrolovat lenght superType -> zeptat se jestli chci doplnit superType -> nabídnout co je v tabulce -> zkontrolovat jestli už není
                    check.push({key: key, types: rule.type, element:element.uri, rule:rule});

                }
                else 
                {
                    if (additionalRules !== false)
                    {
                      
                        for (let addRule of additionalRules)
                        {
                            console.log(JSON.parse(JSON.stringify(addRule)))
                            if (addRule.type.some(r=> elTypes.includes(r))) {
                                check = this.elementConsAddSelection("superType",addRule,elTypes,check,element,allTypes);
                                check = this.elementConsAddSelection("subType",addRule,elTypes,check,element,allTypes);
                                check = this.elementConsAddSelection("connect",addRule,elTypes,check,element,allTypes);
                                if ("moreThanOne" in addRule && addRule["moreThanOne"] === true && elTypes.length < 2)
                                {
                                    check = this.moreThanOneRule(ontoController,element,addRule.mincCountount,addRule.maxCount,check);
                                }
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
                
                for (let index in check)
                {
                  
                    if (check[index].key === type && check[index].element === element.uri)
                    {
                        check.splice(index, 1);
                    }
                }
                check.push({key: type, types: rule[type], element:element.uri, rule:rule});
            }
            else if ("moreThanOne" in rule && rule["moreThanOne"] === true)
            {
                //vrat element dej fathera 
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

    getSpecificRule = (rules, key, moreThanOne, bTypeNumber) =>
    {
        let addRules = [];
        
        bTypeNumber = bTypeNumber === undefined ? false : bTypeNumber; 
        moreThanOne = moreThanOne === undefined ? false : moreThanOne; 
        
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
            ("bam")
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


    commonRuleSelection = (element, fathers,start, ontoModel, fatheFound, addNone) => 
    {

        // tohle vyřeš na úrovni onto modelu!
        let fatherOnto = [];
        let childPuroType = [];
        //const connection =  element.connect.length > 0 ? true : false;  
        let type = "elementSelection"; 
        for (let child of element.childType)
        {
            childPuroType.push(this.delUri(child));
        }

        if (fatheFound)
        {
            fatherOnto.push(element.foundFather.ontoType); 
        }
        else
        {
            for (let node of ontoModel)
            {
                if (fathers.includes(node.uri)) {
                    fatherOnto.push(node.ontoType);
                }
                
            }
        }

        // Změnit!! 
        for (let rule of this.rulesJson.commonRules)
        {

            /*((fatherOnto.some(r=> rule.fatherOnto.includes(r)) || (rule.fatherOnto.includes("none"))) &&
            (element.childType.some(r=> rule.childPuro.includes(r) || 
            (rule.childPuro.includes("none"))) 
           ))
            */
            console.log(start === true)
            console.log(rule.fatherOnto === "NoRelation")
            console.log(rule.fatherOnto)
           if (start === true && rule.fatherOnto[0] === "NoRelation")
           {
             const question = "Which type is "+element.label.value+"?";
             return this.createButtons(rule.offer,question, type,false, element.label.value);
           }
           else if ((fatherOnto.some(r=> rule.fatherOnto.includes(r)) || (rule.fatherOnto.includes("none"))))
            {
                
                if ("invert" in rule && rule["invert"] === true)
                {
                    type += "-invert"
                }
                
                const offerTypes = JSON.parse(JSON.stringify(rule.offer));
                
                if (addNone === true && !offerTypes.includes("None"))
                {
                    offerTypes.push("None");
                }
                
                const question = "Which type is "+element.label.value+"?";
                return this.createButtons(rule.offer,question, type,false, element.label.value);
            }
        }
    }



}