import MainController from "./MainController";

export default class RuleController extends MainController {
     
    ruleSelection (rules, key, element, previousElName, rule, isElementInstance, relationLabel, countBtypes)
    {
        let commands; 
        let offerTypes;
        let question;
        let needElName;
        let elName = "";
        
        if (rule)
        {
            offerTypes = rule; 
        }
        else
        {
            commands = this.getSpecificRule(rules,key, false, countBtypes);
            offerTypes = commands.offer;  
        }

        if (element !== false)
        {
            let additionalQuestion = "";

            if (element.connect.length > 1)
            { 
                additionalQuestion = "\n " + this.getQuestion(relationLabel, "relSpecific");
            }
            
            if (isElementInstance === true)
            {
                needElName =true;

                question = this.getQuestion(element.label.value, "instance") + additionalQuestion;
            }
            else
            {
                needElName = false;

                question = this.getQuestion(element.label.value, "BType") + additionalQuestion;
                elName = element.label.value; 
            }
        }
        else
        {
            needElName = true;
            question = this.getQuestion(previousElName, "bTypeChild");

        }
       
        return this.createButtons(offerTypes,question, "classSelection",needElName,elName);
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

    elementConsistencyRules (element,  ontoController)  
    {
            let rules = this.rulesJson[element.ontoType];    
            let check = []; 


            let elTypes = {
                superType: ontoController.getRelatedTypes(element.uri,"to", "Generalization"), 
                subType: ontoController.getRelatedTypes(element.uri,"from","Generalization"), 
                connect: ontoController.getRelatedTypes(element.uri, "connect", false)
            };

            
            for (let rule of rules)
            {
                check = this.elementConsistencySelection(rule,elTypes,"superType",element,check,rules,elTypes,ontoController);
                check = this.elementConsistencySelection(rule,elTypes,"subType",element,check,rules,elTypes, ontoController);
                check = this.elementConsistencySelection(rule,elTypes,"connect",element,check,rules,elTypes, ontoController);
                if (rule.key === "moreThanOne")
                {
                    check = this.moreThanOneRule(ontoController,element,rule.minCount,rule.maxCount,check);
                }
            }


            if ((check.length > 0 && check[0].types.includes("Relator") && check[0].types.includes("None")))
            {
                check.splice(0, 1);  
            }

            for (let i = 0; i < check.length; i++) {
                check[i]["elLabel"] =  ontoController.getOntoElement(check[i].element).label;  
            }



            return check;
    }



    elementConsistencySelection (rule,elTypes,key,element,check,rules,allTypes, ontoController) 
    {
        if(rule.key === key)
        {
                const suffix = key[key.length - 1] === "e" ? "d" : "ed";
                const additionalRules =  this.getSpecificRule(rules, key + suffix, true);
                if (!rule.type.some(r=> elTypes[key].includes(r)) && rule.type.length > 0 )
                {
                    check.push({key: key, types: rule.type, element:element.uri, rule:rule});
                }
                else 
                {
                    if (additionalRules !== false)
                    {
                        for (let addRule of additionalRules)
                        {
                            if (addRule.type.some(r=> elTypes[key].includes(r))) {
                                check = this.elementConsAddSelection("connect",addRule,elTypes[key],check,element,allTypes); 
                                
                                if (elTypes["superType"].length === 0)
                                {
                                    check = this.elementConsAddSelection("superType",addRule,elTypes[key],check,element,allTypes);
                                }

                                if (elTypes["subType"].length === 0)
                                {
                                    check = this.elementConsAddSelection("subType",addRule,elTypes[key],check,element,allTypes);
                                }  
                                
                                if ("moreThanOne" in addRule && addRule["moreThanOne"] === true && elTypes[key].length < 2)
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

    getSpecificRule (rules, key, moreThanOne, bTypeNumber)
    {
        let addRules = [];
        
        bTypeNumber = bTypeNumber === undefined ? false : bTypeNumber.toString(); 
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

            if (moreThanOne === false && addRules < 1)
            {
                addRules = this.findSimpleRule(rules,key,moreThanOne, true);
                if (addRules.length === 1 && moreThanOne === false) return addRules[0]; 
            }
        }
        else
        {
          addRules = this.findSimpleRule(rules,key,moreThanOne, false);
          if (addRules.length === 1 && moreThanOne === false) return addRules[0]; 
        }

        if (addRules.length > 0)
        {
            return rules;
        }
        else
        {
            return false; 
        }     
    }

    findSimpleRule (rules, key, moreThanOne, last)
    {
        const returnArr = []; 
        
        for (let node of rules)
        {
            
            if (node.key === key && (last === false || !("bTypeNumber" in node))) 
            {
                if (moreThanOne === true)
                {
                    returnArr.push(node);
                }
                else
                {   
                    return [node]; 
                }   
            }
        }

        return returnArr; 



    }

    getAdditionalRule (rule, selectedType, index)
    {
        if (rule !== false && index.toString() in rule && selectedType in rule[index])
        {
            return rule[index][selectedType]; 
        }
        
        return [];
    
    }


    commonRuleSelection (element, fathers,start, ontoModel, fatheFound, addNone) 
    {

        let fatherOnto = [];
        let childPuroType = [];
        let rules = "commonRules";
        let types = "fatherOnto";
 
        let type = "elementSelection"; 
        for (let child of element.childType)
        {
            childPuroType.push(this.delUri(child));
        }

        if (fatheFound)
        {
            types = "childOnto";  
            rules = "specialCasesRules";
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
 
        for (let rule of this.rulesJson[rules])
        {
           if (start === true && rule[types][0] === "NoRelation")
           {
             const question = "Which type is "+element.label.value+"?";
             return this.createButtons(rule.offer,question, type,false, element.label.value);
           }
           else if ((fatherOnto.some(r=> rule[types].includes(r)) || (rule[types].includes("none"))))
           {
                if (("invert" in rule && rule["invert"] === true) || fatheFound === true)
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


}