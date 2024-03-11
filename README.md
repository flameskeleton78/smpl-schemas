# simple-json-schemas

Writing JSON Schemas can be rather intimidating. This package can ease the pain
a bit, by making schema creation quicker and the schema files themselves smaller.

## Quick example

Suppose you have the following schema:

```json
{
    "additionalProperties": false,
    "required": [
        "a"
    ],
    "properties": {
        "a": {
            "type": "string",
            "default": "apple"
        },
        "b": {
            "type": "number",
            "default": 127
        }
    }
}
```

Blech. That's pretty verbose. What if it could be written like this instead?

```json
{
    "properties": {
        "a": "apple",
        "b?": 127
    }
}
```

Much cleaner. You can infer the default value and the type from the property values, so why
not use that? And since we're at it, lets say that properties ending with '?'
are optional! Hopefully this makes adopting JSON Schemas a bit more bearable.

This package works by applying certain rules that act as "transformations" to a
normal JSON schema. They're based on *my* opinions on what is convenient to
write, but if there's interest then I'm open to adding configurability to this
package's behavior. (config for a config package. haha. maybe there'll be a need
for a *simple-json-schemas-schema*? eh... I hope not lol)

## The rules
* infer the default value and type of a property by looking at its direct value
    * `"a": "apple"` becomes `"a": { type: "string", default: "apple" }`
    * the type of `null` is `null`
    * the type of `[...]` is `array`
    * all other types are determined with `typeof`
* A schema with properties is given a type of `object`
    * `"a": { properties: {...} }` becomes `"a": { type: 'object', properties: {...} }`
* `additionalProperties` are assumed to be `false` unless otherwise specified
* `required` is automatically populated with properties that do not end with
    '?'. Properties that do have the trailing '?' are renamed to remove the '?'
* if all properties have a default value set, then those defaults are aggregated
    up to the parent schema object.
    * `"a": { properties: { b: 1, c: 2} }` becomes `"a": { default: { b: 1, c: 2}, properties: {...} }`
* If specified, original values for type, required, and default are preserved

## Usage
* command line:
    * `cat pre.schema.json | npx simple-json-schemas > post.schema.json`
* module:
    ```javascript
    const laziness = require('simple-json-schemas');
    const fs = require('fs');
    const srcSchema = fs.readFileSync('srcSchema.json', 'utf-8');
    const schema = laziness(srcSchema);

    // then you can do something like:
    const Ajv = require('ajv');
    const ajv = new Ajv({ allErrors: true, useDefaults: true });
    const validator = ajv.compile(schema);
    const config = fs.readFileSync('config.json', 'utf-8');
    if (!validator(config)) {
        for (let error of validator.errors) {
            console.error(error);
        }
    }
    ```
## Notes
* Don't expect this to work with schemas that define objects with properties
    that use the same name as any of the reserved schema words (default,
    properties, type, required)
* The module both returns the transformed config object, as well as modifying
    the original