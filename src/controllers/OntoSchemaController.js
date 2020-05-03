import MainController from './MainController';

export default class OntoScheController extends MainController{
 
    transform (ontoModel)
    {
        const ontoUmlSchema = this.schemaInit(); 
        let relCount = 0; 

        for (let node of ontoModel)
        {
            if(node.type === "Class" || node.ontoType.toLowerCase() === "relator")
            {
              ontoUmlSchema["contents"].push(this.ontoClassTransformation(node)); 
            }
        }

        for (let node of ontoModel)
        {
          if (node.type === "relation" && node.ontoType.toLowerCase() !== "relator") {
              let key; 
              
              if (node.from.length >= node.to.length)
              {
                 key = "from";
              }
              else
              {
                key = "to"; 
              }
              
              let opositeIndex = 0;
              for (let index in node[key])
              {
                 
                 let fromIndex = key === "from" ? index : opositeIndex; 
                 let toIndex = key === "to" ? index : opositeIndex; 
                  
                 ontoUmlSchema["contents"].push(this.relationTransformation(node, relCount, fromIndex, toIndex));
                 relCount += 2;  
                 if (index <= node[key].length)
                 {
                    opositeIndex = index; 
                 }
              }
          }
          else if (node.ontoType.toLowerCase() === "relator")
          {
            
            let key; 
              
            if (node.from.length >= node.to.length)
            {
              key = "from";
            }
            else
            {
              key = "to"; 
            }
            
            let opositeIndex = 0;

            for (let index in node[key])
            {
              let nodeCopy = JSON.parse(JSON.stringify(node));
              let nodeCopy2 = JSON.parse(JSON.stringify(node));  

              nodeCopy["uri"] += "rel1"
              nodeCopy2["uri"] += "rel2"
        
              nodeCopy["ontoType"] = "mediation"
              nodeCopy2["ontoType"] = "mediation"
              
              if (key === "from")
              {
                nodeCopy["fromType"] = node["fromType"][index][0]; 
                nodeCopy["toType"] = node["fromType"][index][1];

                if (opositeIndex !== false)
                {
                  nodeCopy2["fromType"] = node["toType"][opositeIndex][0];
                  nodeCopy2["toType"] = node["toType"][opositeIndex][1];
                  nodeCopy2["to"] = [nodeCopy["to"][opositeIndex]];
                }

                
                nodeCopy["from"] = [nodeCopy["from"][index]];
                
              }
              else
              {
                if (opositeIndex !== false)
                {
                  nodeCopy["fromType"] = node["fromType"][opositeIndex][0]; 
                  nodeCopy["toType"] = node["fromType"][opositeIndex][1];
                  nodeCopy["from"] = [nodeCopy["from"][opositeIndex]];
                }
                nodeCopy2["fromType"] = node["toType"][index][0];
                nodeCopy2["toType"] = node["toType"][index][1];
                

                nodeCopy2["to"] = [nodeCopy["to"][index]];
              }
              
              nodeCopy["to"] = [node.uri];
              nodeCopy2["from"] = [node.uri];
              
              console.log (JSON.parse(JSON.stringify(nodeCopy)))
              console.log (JSON.parse(JSON.stringify(nodeCopy2)))

              if (!(key === "to" && opositeIndex === false))
              {
                ontoUmlSchema["contents"].push(this.relationTransformation(nodeCopy, relCount, 0,0));
                relCount += 2;
              } 
              
              if (!(key === "from" && opositeIndex === false))
              {
                ontoUmlSchema["contents"].push(this.relationTransformation(nodeCopy2, relCount,0,0));
                relCount += 2; 
              } 
 
              if (index < node[this.getOpositeDirection(key)].length - 1)
              {
                 opositeIndex = index; 
              }
              else
              {
                 opositeIndex = false; 
              }
            }
          }
        }

        const schemas = require('ontouml-schema');
        const Ajv = require('ajv');
        const validator = new Ajv().compile(schemas.getSchema(schemas.ONTOUML_2));
       
        const isValid = validator(ontoUmlSchema);

        if (isValid)
        {
          return ontoUmlSchema; 
        }
        else
        {
          alert("Model is not valid! Check OntoSchemaCotroller!"); 
          return {}; 
        }
    }

    schemaInit ()
    {
        return {
            "type": "Package",
            "id": "puroConversion",
            "name": null,
            "description": null,
            "contents": [],
            "propertyAssignments": null
            }
    }

    ontoClassTransformation (ontoClass)
    {
      return  {
            "type": "Class",
            "id": ontoClass.uri ,
            "name": ontoClass.label,
            "description": null,
            "properties": null,
            "literals": null,
            "propertyAssignments": null,
            "stereotypes": [ontoClass.ontoType.toLowerCase()],
            "isAbstract": null,
            "isDerived": null
            }
    }

    relationTransformation (relation, relCount, fromIndex, toIndex)
    {

        if (relation.ontoType === "Generalization")
        {
             return {
                "type": "Generalization",
                "id": relation.uri,
                "name": null,
                "description": null,
                "general": {
                  "type": "Class",
                  "id": relation.from[fromIndex]
                },
                "specific": {
                  "type": "Class",
                  "id": relation.to[toIndex]
                },
                "propertyAssignments": {
                  "nonStandardProperty": null
                }
              };
        }
        else
        {
            return {
              "type": "Relation",
              "id": relation.uri,
              "name": null,
              "description": null,
              "properties": [
                {
                  "type": "Property",
                  "id": "prop" + relCount,
                  "name": null,
                  "description": null,
                  "propertyType": {
                    "type": "Class",
                    "id": relation.from[fromIndex]
                  },
                  "cardinality": relation.fromType[fromIndex] === "" || undefined ? null : relation.fromType[fromIndex],
                  "isDerived": null,
                  "isOrdered": null,
                  "isReadOnly": null,
                  "stereotypes": null,
                  "propertyAssignments": null,
                  "subsettedProperties": null,
                  "redefinedProperties": null,
                  "aggregationKind": null
                },
                {
                  "type": "Property",
                  "id": "prop" + (parseInt(relCount) + 1),
                  "name": null,
                  "description": null,
                  "propertyType": {
                    "type": "Class",
                    "id": relation.to[toIndex]
                  },
                  "cardinality": relation.toType[toIndex] === "" || undefined ? null : relation.toType[toIndex],
                  "isDerived": null,
                  "isOrdered": null,
                  "isReadOnly": null,
                  "stereotypes": null,
                  "propertyAssignments": null,
                  "subsettedProperties": null,
                  "redefinedProperties": null,
                  "aggregationKind": null
                }
              ],
              "propertyAssignments": {
                "nonStandardProperty": null
              },
              "stereotypes": [relation.ontoType.toLowerCase()],
              "isAbstract": true,
              "isDerived": false
            }
        }
    }
}