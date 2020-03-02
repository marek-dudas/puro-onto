import MainController from "./MainController";

export default class OntoModelController extends MainController {


    constructor ()
    {
        super();
        this.ontoModel  = []; 
    } 
  
    
    addToOntoModel = (uri, label, ontoType, puroType, relationName, direction,from, to, elName, nameWasChange = false, ontoUri, branchIndex) => 
    {
    
        if (this.getOntoElement(this.ontoUri + elName) === false)
        {
            let elPuroType;
            let elLabel;
            let elUri; 
            if (elName !==  "" && elName !== undefined && nameWasChange === false) 
            {

                elPuroType = false;
                elLabel = elName;
                elUri = this.ontoUri + elName; 

            }
            else
            {
                elPuroType = puroType;
                elLabel = nameWasChange ? elName : label; 
                elUri = uri; 
            }

            this.ontoModel.push({uri: elUri, label:elLabel, ontoType: ontoType, puroType: elPuroType, fromRelation: [relationName], direction: [direction], from: [from], to:[to],type:"Class", branchIndex: [branchIndex]});
        }
        else
        {
            uri = ontoUri + elName; 
            this.updateOntoModel(uri, "fromRelation",relationName);
            this.updateOntoModel(uri, "direction",direction);
            this.updateOntoModel(uri, "branchIndex",branchIndex);
        }
        console.log(this.ontoModel)
        return this.ontoModel; 
    }

    isRelationComplete (relation)
    {
        if (relation.type === "relation" && relation.from.length > 0 && relation.to.length > 0)
        {
            return true;
        }
        return false; 
    }
    
    getCardinalElement (element, superType)
    {

        for (let node of this.ontoModel)
        {
            if (node.type === "relation" && node.ontoType.toLowerCase() === "generalization" && node.from[0] === element && superType === false)
            {
                return node.to[0]; 
            }
            else if (node.type === "relation" && node.ontoType.toLowerCase() === "generalization" && node.to[0] === element && superType === true)
            {
                return node.from[0];
            }
        }
        return false;
    }

    getReletadELement (element, relationName)
    {
        
        for (let node of this.ontoModel)
        {
            if (node.type === "relation" && (node.from.includes(element.uri) || node.to.includes(element.uri)) && this.isRelationComplete(node))
            {
                let relatedElement; 
                if (node.from.includes(element.uri)) 
                {
                    relatedElement = node.to[0];
                }
                else
                {
                    relatedElement = node.from[0];
                } 
                relatedElement = this.getOntoElement(relatedElement);
                if (relatedElement.fromRelation.includes(relationName))
                {
                    return relatedElement; 
                }
            }
        }

        return false; 
    }


    addRelation = (type, from, to, uri,label, fromType, toType) => 
    {
        //fromT toT
        uri = uri === undefined ? this.ontoUri.slice(0,-1) + "/relation/"+type+"/"+this.delUri(from)+this.delUri(to) : uri; 
        fromType = fromType === undefined ? [] : [fromType];
        toType = toType === undefined ? [] : [toType]; 
        from = from === undefined || "" || from.length === 0 ? [] : [from];
        to = to === undefined || "" || to.length === 0 ? [] : [to];
        
        for (let el of this.ontoModel)
        {
            if (el.type === "relation" && el.from.includes(from) && el.to.includes(to))
            {
                return this.ontoModel;
            }
        }


        this.ontoModel.push({type:"relation",ontoType: type, from: from, to: to,uri:uri, label:label, fromType: fromType, toType: toType, fromRelation: []});
        
        return this.ontoModel; 
    }

    updateOntoModel = (elementsUri, property, value, duplicity = true) =>
    {
        for (let node of this.ontoModel)
        {
            if (node.uri === elementsUri) {
                if (Array.isArray(node[property]))
                {
                    if (duplicity === true || !node[property].includes(value))
                    {
                        node[property].push(value);
                    }
                    
                }
                else
                {
                    if (duplicity === true || node[property] !== value)
                    {
                        node[property] = value;
                    } 
                }
                return this.ontoModel;
            }

        }
        return false;
    }

    addToProperty (uri, property, value)
    {
        for (let node of this.ontoModel)
        {
            if (node.uri === uri)
            {
                 
                if (Array.isArray(node[property]))
                {
                    node[property].push(value); 
                    return true; 
                }
            }
        }
        return false; 
    }

    getOntoModel = () =>
    {
        return this.ontoModel; 
    }
    
    getElementsRelation = (uri, direction) =>
    {
        
       
        let returnArr = []; 
        
        for (let node of this.ontoModel)
        {
            let nextRel = false;
            let nextOther = false;
            if (Array.isArray(node[direction]))
            {
                nextRel = node[direction].includes(uri) ? true : false; 
            }

        
            if (node["type"] === "relation" && nextRel === true)
            {
                returnArr.push(node);
            }
            else if(direction === "connect" &&  (node["from"].includes(uri) || node["to"].includes(uri)))
            {
                returnArr.push(node) ;
            }
        }
        
        return returnArr; 
    }



    getElementOntoType = (uri) => 
    {
        let ontoType = false; 
        
        let element = this.getOntoElement(uri);

        if (element === false)
        {
            return false;
        }
        else
        {
            return element.ontoType; 
        }

    }

    getElementsByOntoType = (type, origin) => 
    {
       let result = [];

       for (let node of this.ontoModel)
       {
            if (type === node.ontoType && (origin === undefined || node.fromRelation.includes(origin)))
            {  
                result.push(node.uri);
            }
       }
       return result; 

    }

    getOntoElement = (uri) => 
    {
        for (let node of this.ontoModel)
        {
            if (node.uri === uri) 
            {
                return node; 
        
            }
        }
        return false;
    }

    changeOrigin = (uri, origin) => 
    {
       for (let i = 0; i < this.ontoModel.length; i++)   
       {
         if (this.ontoModel[i].uri === uri) {
             this.ontoModel[i].origin = origin; 
             return true;
         }
       }
       return false; 
    }

    

    getLastElementUri = (origin, direction) => 
    {
        var uri; 
        for (let i = this.ontoModel.length - 1; i >= 0; i--) 
        {

            for (let j = 0; j < this.ontoModel[i].fromRelation.length; j++) {
               
                if (this.ontoModel[i].fromRelation[j] === origin && this.ontoModel[i].direction[j] === direction && this.ontoModel[i].ontoType !== "Datatype")
                {
                    uri = this.ontoModel[i].uri;
                    return uri;
                }
                else if (this.ontoModel[i].fromRelation[j] === origin && direction === undefined)
                {
                    uri = this.ontoModel[i].uri;
                    return uri; 
                }
                else if(origin === undefined && direction === undefined)
                {
                    return this.ontoModel[i].uri;
                }
            }
        }

        return false; 
    }

    getLastElement = (origin, direction) =>
    {
        const uri = this.getLastElementUri(origin, direction);
        return this.getOntoElement(uri); 
    }

    getFatherOntoType = (element) => 
    {

        let result = []; 
        if ('father' in element)
        {
            for (let node of this.ontoModel)
            {
                if(element.father.includes(node.uri))
                {
                    result.push(node.ontoType);
                }
            }
        }

        if(result.length === 0)
        {
            result = [""];
        }
        return result;
    }

    getRelationElements = (elName, element, selectedUri, relationUri, addRulesLenght, lastEl, puroType, ontoUri, ruleKey, nameWasChange, moreBranches) => 
    {
        if (elName !== "" && puroType !== "dataType" && nameWasChange === false && element !== false)
        {
         
            let father;
            let passEl; 
            
            if (puroType === "superType")
            {
                father = this.ontoUri + elName;
                passEl = element.uri.value; 
            }
            else if (puroType === "subType")
            {
                passEl = this.ontoUri + elName;    
                father = element.uri.value;
            }
            else
            {
                father = element.father[0] === undefined ? element.uri.value : element.father[0];
                passEl = this.ontoUri + elName; 
            }

            alert(father)
            alert(passEl)
            return [father, passEl];

        }
        else if (puroType === "elementSelection")
        {   
            
            //father může být pole.. předělat!!!
            let elementFather = this.getOntoElement(element.father[0]);
            return [elementFather.uri, element.uri.value];
            //this.addRelation("Dodělat závislé na pravidlech", elementFather.uri , element.uri.value);
        }
        //relationRule zrušit addRuleTakyZrušit 
        else if((addRulesLenght === 0 && lastEl === true) || element === false )
        {
            
            const lastRelElement = this.getLastElement(relationUri);
            const passEl = (element === false) ? ontoUri + elName : selectedUri;
        console.log(lastRelElement)
            if (lastRelElement !== false && (lastRelElement.direction[lastRelElement.direction.length - 1] !== ruleKey || moreBranches === true) && addRulesLenght === 0)
            {
                this.updateOntoModel(relationUri,ruleKey,passEl, false);
                
                return relationUri; 
            }
            else if (element === false || lastRelElement !== false)
            {
                return [lastRelElement.uri, passEl];
            }
            
        }  
    
    }

    checkDuplicity = (label) => 
    {
        for (let node of this.ontoModel)
        {
            if (node.label === label) {
                return false;
            }
        }

        return true; 
    }

    getRelatedTypes = (elUri, direction, ontoType) => 
    {
        let rels = this.getElementsRelation(elUri, direction);
        let elements = [];
        let types = []; 
        for (let rel of rels)
        {
          //Arrow 
          if (rel.ontoType === ontoType || direction === "connect")
          {
              const el = (rel.to.includes(elUri)) ? rel.from[rel.to.indexOf(elUri)] : rel.to[rel.from.indexOf(elUri)];
              
              elements.push(el);
              types.push(this.getElementOntoType(el));
          }
          else if (ontoType === false && rel.ontoType !== "Generalization")
          {
            if (rel.ontoType === "Relator")
            {
                types.push(rel.ontoType);
            }
            else 
            {

                const el = (rel.to.includes(elUri)) ? rel.from[rel.to.indexOf(elUri)] : rel.to[rel.from.indexOf(elUri)];
                elements.push(el);
        
                types.push(this.getElementOntoType(el)); 
            }
          }
        }  

        return types; 
    }

    getElementsFromBranch(element)
    {

        let returnArr = [element];
        let el = element;
    
        while (this.getCardinalElement(el,true) !== false)
        {   
            el = this.getCardinalElement(el, true);
            returnArr.push(el);
        }

        return returnArr; 
    }

    
    getOntoBranch(relation, key)
    {
        let returnArr = [];
        for (let el of this.ontoModel)
        {
            for (let index in el.fromRelation)
            {
                if (el.fromRelation[index] === relation && el.direction[index] === key)
                {
                    returnArr.push(el);
                }
            }
        }
        
        return returnArr; 
    }
    
    connectToBranchElement(relation, key, selectedEl)
    {

        const question =  "To which element is the " + this.delUri(selectedEl.uri.value) + " connected?";

        const firstEl = (this.getOntoBranch(relation, key)[0]);
        const lastEl = this.getLastElement(relation, key);

        return this.createButtons([firstEl.label, lastEl.label],question, "nextBranchElements", false, "");
        if (firstEl.uri === lastEl.uri)
        {
            return false;
        }
        else
        {
           
        }

    }



    undo (ontoModelHistory)
    {
        
        this.ontoModel =  JSON.parse(JSON.stringify(ontoModelHistory));  
   
    }




}

