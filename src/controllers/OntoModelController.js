import { updateExpression } from "@babel/types";

export default class OntoModelController {


    constructor ()
    {
        this.ontoModel  = []; 
    } 
  
    
    addToOntoModel = (uri, label, ontoType, puroType, relationName, direction,from, to, elName, nameWasChange = false) => 
    {
    
       
        let elPuroType;
        let elLabel;
        let elUri; 

        if (elName !==  "" && elName !== undefined && nameWasChange === false) 
        {
            elPuroType = false;
            elLabel = elName;
            elUri = "http://lod2-dev.vse.cz/data/ontomodels#" + elName; 
        }
        else
        {
            elPuroType = puroType;
            elLabel = nameWasChange ? elName : label; 
            elUri = uri; 
        }

        this.ontoModel.push({uri: elUri, label:elLabel, ontoType: ontoType, puroType: elPuroType, fromRelation: relationName, direction: direction, from: from, to:to});
        console.log(this.ontoModel)



        return this.ontoModel; 
    }

    addRelation = (type, from, to, uri, label, fromType, toType) => 
    {
        //fromT toT
        this.ontoModel.push({type:"relation",ontoType: type, from:from, to:to,uri:uri, label:label, fromType: fromType, toType: toType});
        
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

    getElementsByOntoType = (type) => 
    {
       let result = [];

       for (let node of this.ontoModel)
       {
            if (type === node.ontoType)
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

    getLastElementUri = (origin) => 
    {
        var uri; 
        for (let i = this.ontoModel.length - 1; i >= 0; i--) 
        {
            if (this.ontoModel[i].fromRelation === origin)
            {
                uri = this.ontoModel[i].uri;
                return uri; 
            }
            else if(origin === undefined)
            {
                return this.ontoModel[i].uri;
            }
            
        }

        return false; 
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

    getRelationElements = (elName, element, selectedUri, relationUri, addRulesLenght, relationRuleIndex, puroType, ontoUri, ruleKey, nameWasChange = false) => 
    {
        
        if (elName !== "" && puroType !== "dataType" && nameWasChange === false)
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
                father = element.father[0];
                passEl = ontoUri + elName; 
            }
            return [father, passEl];

        }
        else if( relationRuleIndex === 2 && addRulesLenght === 0)
        {
            
            
            let lastRelElement;
            let passEl = (selectedUri === false) ? ontoUri + elName : selectedUri;
            
            for (let index = this.ontoModel.length - 1; index >= 0; index --)
            {
                console.log(this.ontoModel);
                if (this.ontoModel[index]["fromRelation"] === relationUri)
                {
                    lastRelElement = this.ontoModel[index];
                    break;
                }
            }
            
            if (lastRelElement.direction !== ruleKey && lastRelElement.fromRelation === relationUri)
            {
                this.updateOntoModel(relationUri,ruleKey,passEl);
                return relationUri; 
            }
            else
            {
                return [lastRelElement.uri, passEl];
            }
            
        }  
        else if (puroType === "elementSelection")
        {   
            //father může být pole.. předělat!!!
            let elementFather = this.getOntoElement(element.father[0]);
            return [elementFather.uri, element.uri.value];
            //this.addRelation("Dodělat závislé na pravidlech", elementFather.uri , element.uri.value);
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

