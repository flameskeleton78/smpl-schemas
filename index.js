const _ = require('lodash');

// safe type checking because javascript is *weird*
function getType (x) {
    if (x instanceof Array) { // typeof [] === 'object'
        return 'array';
    }
    if (x instanceof Object) { // typeof null === 'object'
        return 'object';
    }
    if (x === null) {
        return null;
    }
    return typeof x;
}

function processProperties (properties, schema) {
    const definesRequired = _.has(schema, 'required');
    schema.required = schema.required || [];

    let allDefaulting = true; // until shown otherwise
    for (let propertyName in properties) {
        let propertyValue = properties[propertyName];

        const propertyIsSchema = _.get(propertyValue, 'properties') || _.get(propertyValue, 'default') || _.get(propertyValue, 'type');

        // convert direct values into a schema
        if (!propertyIsSchema) {
            propertyValue = properties[propertyName] = {
                default: propertyValue // infer default value by looking at direct value
            };
        }

        // propertyValue is now a schema

        // infer type from default value
        if (_.has(propertyValue, 'default') && !_.has(propertyValue, 'type')) {
            propertyValue.type = getType(propertyValue.default);
        }

        // infer type is 'object' if it has a properties object itself
        if (_.has(propertyValue, 'properties') && !_.has(propertyValue, 'type')) {
            propertyValue.type = 'object';
        }

        // allow assumptions on sub-properties
        if (_.has(propertyValue, 'properties')) {
            propertyValue = properties[propertyName] = checkProperties(propertyValue);

            // don't allow additional properties
            if (!_.has(propertyValue, 'additionalProperties')) {
                propertyValue.additionalProperties = false;
            }
        }

        // Assume properties ending with '?' are optional, and all others are required
        if (!definesRequired) { // don't modify required if it's already defined
            if (propertyName.match(/.+\?$/)) {
                propertyName = propertyName.slice(0, -1); // trim trailing '?'
                propertyValue = properties[property] = properties[property + '?']; // copy over to replacement property name
                delete properties[property + '?']; // remove old property name
            } else {
                schema.required.push(propertyName);
            }
        }

        if (!_.has(propertyValue, 'default')) {
            allDefaulting = false;
        }
    }

    // all properties have been checked

    // if an objects properties all have defaults, then aggregate those defaults up
    if (schema.type === 'object' && !_.has(schema, 'default') && allDefaulting) {
        schema.default = {};
        for (let propertyName in properties) {
            schema.default[propertyName] = properties[propertyName].default;
        }
    }
}

// call this on a schema object. It will look for a properties object and process those
function checkProperties (schema) {
    if (!schema) return schema;

    if (_.has(schema, 'properties')) processProperties(schema.properties, schema);
    return schema;
}

module.exports = checkProperties;