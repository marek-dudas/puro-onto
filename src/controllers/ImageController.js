import MainController from "./MainController";

export default class ImagController extends MainController {

    constructor()
    {
        super();
        this.ontoModel = [];
    }

    createGraph  (ontoModel) 
    {
        this.ontoModel = ontoModel;
        let graphCommand = "classDiagram\n"; 


        for (let node of this.ontoModel)
        {
            if (node["type"] === "relation" && this.findLabel(node.to[0]) !== false && this.findLabel(node.from[0]) !== false) {
                if (node.ontoType === "Relator")
                {
                    if (node.from.length > 0 && node.to.length > 0) 
                    {
                    
                        graphCommand += 'class '+ node.label + `{
                                <<`+ node.ontoType + `>>
                        }\n`;   
                        
                        for (let key in node.from)
                        {
                            graphCommand += this.findLabel(node.from[key]) +" "+ (node.fromType[key] ? '"'+node.fromType[key][0]+'"' : "") +" .. "+ (node.toType[key] ? '"'+node.fromType[key][1]+'"' : "") + " " + node.label +  " : <<Mediation>>\n";
                        }
                        
                        for (let key in node.to)
                        {
                            graphCommand += node.label +" "+ (node.toType[key] ? '"'+node.toType[key][0]+'"' : "") +" .. "+ (node.toType[key]  ? '"'+node.toType[key][1]+'"' : "") + " " + this.findLabel(node.to[key]) + " : <<Mediation>>\n"; 
                        }
                      
                    }
                }
                else
                {
                    
                    const relationSpec = this.getRelationSpec(node.ontoType);
                    if (node.from.length === node.to.length)
                    {
                        for (let key in node.from)
                        {
                            graphCommand += this.findLabel(node.from[key]) +" "+ (node.fromType[key] ? '"'+node.fromType[key]+'"' : "") + relationSpec[0] + (node.toType[key] ? '"'+node.toType[key]+'"' : "") + " " + this.findLabel(node.to[key]) + (relationSpec[1] === true ? " : <<"+node.ontoType.split('-')[0]+">>" : "" ) + "\n"; 
                        }
                    }
                    else
                    {
                        for (let key in node.from)
                        {
                            let base = this.findLabel(node.from[key]) +" "+ (node.fromType[key] ? '"'+node.fromType[key]+'"' : "") + relationSpec[0];
                            
                            for (let toKey in node.to)
                            {
                                graphCommand += base + (node.toType[toKey] ? '"'+node.toType[toKey]+'"' : "") + " " + this.findLabel(node.to[toKey]) + (relationSpec[1] === true ? " : <<"+node.ontoType.split('-')[0]+">>" : "" ) + "\n"; 
                            }
                        }
                    }   
                }

            }
            else if (node["type"] !== "relation")
            {
              
                graphCommand += 'class '+ node.label + `{
                    <<`+ node.ontoType + `>>
                }\n`;   
            }
        }
        return graphCommand = (graphCommand.trim() === "classDiagram") ? false : graphCommand; 
    }
    
    getRelationSpec (ontoType)
    {
        for(let rel of this.rulesJson.relations)
        {
            
            if (ontoType in rel)
            {
                
                const normRelType = rel[ontoType]; 
                const showType = "showType" in rel && rel["showType"] === true ? true : false;  
                let code; 
                switch(normRelType.toLowerCase())
                {
                    case "arrowline": code = " <|-- ";  
                        break; 
                    case "simpleline": code = " -- "; 
                        break; 
                    case "simplearrow": code =" --> "
                        break; 
                    case "dashedline": code = " .. "; 
                        break; 
                    case "composition": code = " *-- "; 
                        break; 
                    case "aggregation": code = " o-- "; 
                        break; 
                    default:  code = " -- "; 
                }
            
                return [code, showType]; 
            }
        }
    }


    findLabel (uri)
    {
        for (let node of this.ontoModel)
        {
            if (node.uri === uri)
            {
                return node.label;
            }
        }

        return false;

    }

}