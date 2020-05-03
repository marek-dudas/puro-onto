import MainController from "./MainController";

export default class OntoModelController extends MainController {


    constructor ()
    {
        super();
        this.ontoModel  = []; 
    } 
  
    
    
      
    // Create element in OntoModel 
    addToOntoModel = (uri, label, ontoType, puroType, relationName, direction, elName, nameWasChange, ontoUri, branchIndex, origUri) => 
    {
    
        if (this.getOntoElement(this.ontoUri + elName) === false)
        {
            let elPuroType;
            let elLabel;
            let elUri; 
            nameWasChange = nameWasChange === undefined ? false : nameWasChange;
            origUri = origUri === undefined ? "" : origUri;
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

            if (this.getOntoElement(elUri) === false)
            {
                this.ontoModel.push({uri: elUri, label:elLabel, ontoType: ontoType, puroType: elPuroType, fromRelation: [relationName], direction: [direction], from: [undefined], to:[undefined],type:"Class", branchIndex: [branchIndex], origUri:origUri});
            }    
        }
        else
        { 
            if (nameWasChange) this.updateOntoModel(uri, "label",elName);
            this.updateOntoModel(uri, "fromRelation",relationName);
            this.updateOntoModel(uri, "direction",direction);
            this.updateOntoModel(uri, "branchIndex",branchIndex);
        }
        console.log(this.ontoModel)
        return this.ontoModel; 
    }

    // Checks if relation has defined connected elements
    isRelationComplete (relation)
    {
        if (relation.type === "relation" && relation.from.length > 0 && relation.to.length > 0)
        {
            return true;
        }
        return false; 
    }
    
    // gets the most genereral entity to input entity 
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

    
    getElementByProperty (property, value)
    {
        for (let node of this.ontoModel)
        {
            if (node[property] === value)
            {
                return node; 
            }
        }

        return false; 
    }

    // get another element which is connect to input element 
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

    // add relationship into the model
    addRelation = (type, from, to, uri,label, fromType, toType) => 
    {
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

    // update element in the model
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

    // add property value to element
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
    
    //get relation which is element connect to
    getElementsRelation = (uri, direction) =>
    {
        
       
        let returnArr = []; 
        
        for (let node of this.ontoModel)
        {
            let nextRel = false;
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


    getRelation(from, to)
    {
        for (let node of this.ontoModel)
        {
            if (node.type === "relation" && node.from.includes(from) && node.from.includes(to))
            {
                return node; 
            }
        }
        return false;
    }

    // get last element in the branch
    getLastElementUri = (origin, direction, branchIndex) => 
    {
        for (let i = this.ontoModel.length - 1; i >= 0; i--) 
        {
            for (let j = 0; j < this.ontoModel[i].fromRelation.length; j++) {
               
                if ((this.ontoModel[i].fromRelation[j] === origin && this.ontoModel[i].branchIndex.includes(branchIndex) && this.ontoModel[i].direction[j] === direction && this.ontoModel[i].ontoType !== "Datatype"))
                {
                    return this.ontoModel[i].uri;
                }
                else if (this.ontoModel[i].fromRelation[j] === origin && this.ontoModel[i].direction[j] === direction && this.ontoModel[i].ontoType !== "Datatype" && branchIndex === undefined)
                {
                    return this.ontoModel[i].uri;
                }
                else if (this.ontoModel[i].fromRelation[j] === origin && direction === undefined && branchIndex === undefined)
                {
                    return this.ontoModel[i].uri; 
                }
                else if(origin === undefined && direction === undefined  && branchIndex === undefined)
                {
                    return this.ontoModel[i].uri;
                }
            }
        }

        return false; 
    }

    // get last element in relation row
    getElementInRelRow (lastElUri)
    {
        
        const relElements = this.getElementInRelation(lastElUri,"*","from",false); 
        if (relElements.length === 0)
        {
            return lastElUri;
        }
        
        const fatherChildren = this.getElementInRelation(relElements[0].element.uri,"*","to",this.getOntoElement(lastElUri).ontoType); 

        return fatherChildren[0].element.uri; 

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

    // selects the relation elements for event controller processing
    getRelationElements = (elName, element, selectedUri, relationUri, addRulesLenght, lastEl, puroType, isElInstance, ruleKey, nameWasChange, branchesCount) => 
    {
  
        const ontoEl = this.getOntoElement(selectedUri);
   
        if (elName !== "" && puroType !== "dataType" && nameWasChange === false && isElInstance === false && (element !== false || ontoEl !== false))
        {    
           
            let father;
            let passEl; 
            if (puroType === "superType")
            {
                father = this.ontoUri + elName;
                passEl = ontoEl !== false ? ontoEl.uri : element.uri.value; 
            }
            else if (puroType === "subType")
            {
                passEl = this.ontoUri + elName;    
                father = ontoEl !== false ? ontoEl.uri : element.uri.value; 
            }
            else
            {

                if (element !== false)
                {
                   
                    father = element.father[0] === undefined ? element.uri.value : element.father[0];
                   
                }
                else
                {
                    father = ontoEl.uri;
                }
                passEl = this.ontoUri + elName; 
            }
            return [father, passEl];

        }
        else if (relationUri === null)
        {
            if (element.father.length > 0)
            {

                return [element.father[0], element.uri.value];
            }
            else return false; 
            
        }
        else if (puroType.includes("elementSelection") || (element !== false && this.getOntoElement(element.father[0]) !== false))
        {   
            let elementFather = "foundFather" in element ? element.foundFather : this.getOntoElement(element.father[0]);
            if ((puroType.includes("invert") || !puroType.includes("elementSelection")) && !puroType.includes("classSelection"))
            {
 
                return [element.uri.value, elementFather.uri];
            }
            else
            {
                return [elementFather.uri,element.uri.value];
            
            }
        }
        else if((addRulesLenght === 0 && lastEl === true) || element === false || isElInstance === true)
        {
            let lastRelElement = this.getLastElement(relationUri);
            lastRelElement = this.getOntoElement(this.getElementInRelRow(lastRelElement.uri))
          
            const passEl = (element === false || isElInstance === true) ? this.ontoUri + elName : selectedUri;

            let lastElUri = this.getLastElementUri(relationUri,ruleKey, branchesCount);
            lastElUri = this.getElementInRelRow(lastElUri); 
    
            if (lastRelElement !== false && (lastRelElement.direction[lastRelElement.direction.length - 1] !== ruleKey || branchesCount > 1) && addRulesLenght === 0)
            {
             
                if (lastElUri !== false && !this.isRelationExist(lastElUri,passEl) &&  this.getOntoBranch(relationUri, ruleKey).length > 1)
                {
                    return [lastElUri, passEl];
                }
              
                this.updateOntoModel(relationUri,ruleKey,passEl, false);
                return relationUri; 
            }
            else if (element === false || lastRelElement !== false || isElInstance === true)
            {
                
                return [lastRelElement.uri, passEl];
            }
            
        }  
        
    }

    checkDuplicity (label) 
    {
        for (let node of this.ontoModel)
        {
            if (node.label === label) {
                return false;
            }
        }

        return true; 
    }

    getRelatedTypes (elUri, direction, ontoType) 
    {
        let rels = this.getElementsRelation(elUri, direction);
        let elements = [];
        let types = []; 
        for (let rel of rels)
        {
          if (rel.ontoType === ontoType || (ontoType === "Generalization" && rel.ontoType.includes("memberOf")))
          {
              const el = (rel.to.includes(elUri)) ? rel.from[rel.to.indexOf(elUri)] : rel.to[rel.from.indexOf(elUri)];
              elements.push(el);
              types.push(this.getElementOntoType(el));
          }
          else if (ontoType === false && rel.ontoType === "Relator")
          {
            types.push(rel.ontoType); 
          }
          else if (ontoType === false)
          {
            const el = (rel.to.includes(elUri)) ? rel.from[rel.to.indexOf(elUri)] : rel.to[rel.from.indexOf(elUri)];
            elements.push(el);
            types.push(this.getElementOntoType(el)); 
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

    getElementInRelation(elementUri, relationType, direction, ontoType)
    {
        let returnArr = [];
        const all = relationType === "*" ? true : false; 
        ontoType = ontoType === undefined || false ? false : ontoType; 

        for (let relation of this.ontoModel)
        {
     
            if (relation.type === "relation" && (relation.ontoType === relationType || all) && relation[this.getOpositeDirection(direction)].includes(elementUri))
            {   
                let el = this.getOntoElement(relation[direction][0]);
         
                if (ontoType === false || ontoType === el.ontoType)
                {
                    returnArr.push({element : el, relationType: relation.ontoType}); 
                } 
            }
        }
        return returnArr; 
    }

    isRelationExist(el1, el2)
    {
        for (let el of this.ontoModel)
        {
            if (el.type === "relation" && ((el.from === el1 && el.to === el2) || (el.from === el2 && el.to === el1)))
            {
                return true;
            }
        }
        return false; 
    }

    getOntoBranch(relation, key, branchIndex)
    {
        let returnArr = [];
        branchIndex = branchIndex === undefined ? false : branchIndex;
        for (let el of this.ontoModel)
        {
            for (let index in el.fromRelation)
            {
                if (el.fromRelation[index] === relation && el.direction[index] === key && (branchIndex === false || el.branchIndex.includes(branchIndex)))
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

        if (firstEl === undefined || lastEl === false)
        {
            return false
        }
        else
        {
            
            return this.createButtons([firstEl.label, lastEl.label],question, "nextBranchElements", false, "");
        }

    }

    undo (ontoModelHistory)
    {
        
        this.ontoModel =  JSON.parse(JSON.stringify(ontoModelHistory));  
   
    }
}

