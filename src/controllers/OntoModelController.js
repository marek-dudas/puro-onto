export default class RuleController {


    constructor ()
    {
        this.ontoModel  = []; 
    } 
  
    
    addToOntoModel = (uri, label, ontoType, puroType, relationName, direction,from, to, elName) => 
    {
    
       
        let elPuroType;
        let elLabel;
        let elUri; 
        
        if (elName !==  "" && elName !== undefined)
        {
            elPuroType = false;
            elLabel = elName;
            elUri = "http://lod2-dev.vse.cz/data/ontomodels#" + elName; 
        }
        else
        {
            elPuroType = puroType;
            elLabel = label;
            elUri = uri; 
        }

        this.ontoModel.push({uri: elUri, label:elLabel, ontoType: ontoType, puroType: elPuroType, fromRelation: relationName, direction: direction, from: from, to:to});
        console.log(this.ontoModel)
        return true; 
    }

    addRelation = (type, from, to, uri, label) => 
    {
        this.ontoModel.push({type: "relation", ontoType: type, from:from, to:to,uri:uri, label:label});
        
        return true; 
    }

    updateOntoModel = (elementsUri, property, value) =>
    {
        for (let node of this.ontoModel)
        {
            if (node.uri === elementsUri) {
                node[property] = value; 
                return true;
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
                return node;
            }
            else if(direction === undefined && (node["from"] === uri || node["to"] === uri))
            {
                returnArr.push(node) ;
            }
        }
        if (returnArr.length > 0) 
        {
            return returnArr;
        }
        else 
        {
            return false;
        }
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





}

