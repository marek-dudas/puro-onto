import MainController from "./MainController";

export default class ImagController extends MainController {

    constructor()
    {
        super();
        this.ontoModel = [];
    }

    createGraph = (ontoModel) =>
    {
        this.ontoModel = ontoModel;
        let graphCommand = "classDiagram\n"; 


        for (let node of this.ontoModel)
        {
            if (node["type"] === "relation" && this.findLabel(node.to) !== false && this.findLabel(node.from) !== false) {
                if (node.ontoType === "Relator")
                {
                    if (node.from && node.to) 
                    {
                       const fromT = node.fromType;
                       const toT = node.toType;

                    
                        graphCommand += 'class '+ node.label + `{
                                <<`+ node.ontoType + `>>
                        }\n`;   
                        
                        graphCommand += this.findLabel(node.from) +" "+ (fromT ? '"'+fromT[0]+'"' : "") +" .. "+ (toT ? '"'+fromT[1]+'"' : "") + " " + node.label +  " : <<Mediation>>\n"; 
                        graphCommand += node.label +" "+ (toT ? '"'+toT[0]+'"' : "") +" .. "+ (toT ? '"'+toT[1]+'"' : "") + " " + this.findLabel(node.to) + " : <<Mediation>>\n"; 
                    }
                }
                else
                {
                    
                    const fromT = node.fromType;
                    const toT = node.toType;
                    const relationSpec = this.getRelationSpec(node.ontoType);

                    graphCommand += this.findLabel(node.from) +" "+ (fromT ? '"'+fromT+'"' : "") + relationSpec[0] + (toT ? '"'+toT+'"' : "") + " " + this.findLabel(node.to) + (relationSpec[1] === true ? " : <<"+node.ontoType+">>" : "" ) + "\n"; 
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
            if (ontoType.toLowerCase() in rel)
            {
                const normRelType = rel[ontoType.toLowerCase()].toLowerCase(); 
                const showType = "showType" in rel && rel["showType"] === true ? true : false;  
                let code; 
                switch(normRelType)
                {
                    case "arrowline": code = " --|> "; 
                        break; 
                    case "simpleline": code = " -- "; 
                        break; 
                    case "dashedline": code = " .. "; 
                        break; 
                    case "composition": code = " --* "; 
                        break; 
                    case "aggregation": code = " --o "; 
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