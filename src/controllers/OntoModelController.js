import MainController from "./MainController";

export default class OntoModelController extends MainController {


    constructor ()
    {
        super();
        this.ontoModel  = []; 
    } 
  
    
    addToOntoModel = (uri, label, ontoType, puroType, relationName, direction,from, to, elName, nameWasChange = false, ontoUri) => 
    {
    
       
        let elPuroType;
        let elLabel;
        let elUri; 

        if (elName !==  "" && elName !== undefined && nameWasChange === false) 
        {
            elPuroType = false;
            elLabel = elName;
            elUri = ontoUri + elName; 
        }
        else
        {
            elPuroType = puroType;
            elLabel = nameWasChange ? elName : label; 
            elUri = uri; 
        }

        this.ontoModel.push({uri: elUri, label:elLabel, ontoType: ontoType, puroType: elPuroType, fromRelation: [relationName], direction: [direction], from: from, to:to,type:"Class"});
        console.log(this.ontoModel)



        return this.ontoModel; 
    }



    addRelation = (type, from, to, uri,label, fromType, toType) => 
    {
        //fromT toT
        uri = uri === undefined ? this.ontoUri.slice(0,-1) + "/relation/"+type+"/"+this.delUri(from)+this.delUri(to) : uri; 
        this.ontoModel.push({type:"relation",ontoType: type, from:from, to:to,uri:uri, label:label, fromType: fromType, toType: toType, fromRelation: []});
        
        return this.ontoModel; 
    }

    updateOntoModel = (elementsUri, property, value) =>
    {
        for (let node of this.ontoModel)
        {
            if (node.uri === elementsUri) {
                node[property] = value; 
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
            if (node["type"] === "relation" && node[direction] === uri)
            {
                //může být víc 
                returnArr.push(node);
            }
            else if(direction === "connect" && (node["from"] === uri || node["to"] === uri))
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
                if (this.ontoModel[i].fromRelation[j] === origin && this.ontoModel[i].direction[j] === direction)
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

    getLastElement = (origin) =>
    {
        const uri = this.getLastElementUri(origin);
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

    getRelationElements = (elName, element, selectedUri, relationUri, addRulesLenght, lastEl, puroType, ontoUri, ruleKey, nameWasChange = false, prevElement) => 
    {

        if (elName !== "" && puroType !== "dataType" && nameWasChange === false && element !== false)
        {
            let father;
            let passEl; 
            
            if (puroType === "superType")
            {
                father = ontoUri + elName;
                passEl = element.uri.value; 
            }
            else if (puroType === "subType")
            {
                passEl = ontoUri + elName;    
                father = element.uri.value;
            }
            else
            {
                
                father = element.father[0] === undefined ? element.uri.value : element.father[0];
                passEl = ontoUri + elName; 
            }
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
           
            let lastRelElement = null;
            let passEl = (element === false) ? ontoUri + elName : selectedUri;
            for (let index = this.ontoModel.length - 1; index >= 0; index --)
            {
                if (this.ontoModel[index]["fromRelation"].includes(relationUri))
                {
                    lastRelElement = this.ontoModel[index];
                    break;
                }
            }
            

            if (lastRelElement !== null && lastRelElement.direction[lastRelElement.direction.length - 1] !== ruleKey && lastRelElement.fromRelation.includes(relationUri) && addRulesLenght === 0)
            {

                this.updateOntoModel(relationUri,ruleKey,passEl);
                return relationUri; 
            }
            else if (element === false || lastRelElement !== null)
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
          if (rel.ontoType === ontoType)
          {
              let el = (elUri === rel.to) ? rel.from : rel.to;
              elements.push(el);
              types.push(this.getElementOntoType(el));
          }
          else if (ontoType === false && rel.ontoType !== "Arrow")
          {
            if (rel.ontoType === "Relator")
            {
                types.push(rel.ontoType);
            }
            else 
            {
                let el = (elUri === rel.to) ? rel.from : rel.to;
                elements.push(el);
                types.push(this.getElementOntoType(el)); 
            }
          }
        }  

        return types; 
    }

    undo (ontoModelHistory)
    {
        
        this.ontoModel =  JSON.parse(JSON.stringify(ontoModelHistory));  
   
    }




}

