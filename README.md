# Permute JS

A small low dependency library for normalizing and validating data. This primary goal of this library was to improve data interaction of the frontend and provide a solution for developers, who may not have the ability to work with the API team to get the ideal shape of data, can now quickly normalize that data into formats that best suite their needs rather than shaping their application around less than ideal data structures. This idea was inspired by the Redux community in the following article https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape.

Immutable data structures have been found to lower bug density considerably. However, for most modern frontend developers using reactive frameworks like Vue or React, we are unable to implement immutable data structures in our state management systems because the rendering systems of these frameworks are depdenent upon mutable data structures. This library aims to provide an alternative solution to immutablility by providing normalization and validation middleware to ensure your data is in the shape you need and always has the values you need (lowered value mutability errors).

## Usage

The entry point to the formatter is through the **Permute.Shape()** facade which takes two arguments, the data you want to format, and the schema to which the data should be formatted to.

Since I am primarily a Vue.js developer I will be providing example use cases of how I use this library in our applications here at the taproom but the patterns can be utilized in any state management system I'd imagine, the framework is agnostic so you could even use it across the whole stack if you'd like!

## Normalization

```js
async GET_PRODUCTS({ commit }) {
  const schema = {
    product: {
      _uid: "id",
      id: String,
      title: String,
      handle: String,
      availableForSale: Boolean,
      productType: String,
      onlineStoreUrl: String,
      images: [String],
      vendor: String,
      variants: [String],
    },
    variants: {
      _uid: "id",
      id: String,
      price: String,
      title: String,
      compareAtPrice: [String, null],
      available: Boolean,
      selectedOptions: [Object],
      products: String,
    }
  };


  const res = await fetch("https://api.com/products");
  const { products } = await res.json();
  const formatted = await Permute.Shape(products, schema); // async coming soon!
  commit("SET_PRODUCTS", formatted);
}
```

### And in the near future, I'll be releasing a vuex plugin so you can add schema to your vuex modules as if they were natively part of the library!

```js
export const PRODUCTS_MODULE = {
  actions: {
    async GET_PRODUCTS({ commit }) {
      const res = await fetch("https://api.com/products");
      const { products } = await res.json();
      const formatted = await Permute.Shape(products, schema);
      commit("SET_PRODUCTS", formatted);
    }
  },
  schema: {
    products: {
      _uid: "id",
      id: String,
      title: String,
      handle: String,
      availableForSale: Boolean,
      productType: String,
      onlineStoreUrl: String,
      images: [String],
      vendor: String,
      variants: [String],
    },
    variants: {
      _uid: "id",
      id: String,
      price: String,
      title: String,
      compareAtPrice: [String, null],
      available: Boolean,
      selectedOptions: [Object],
      products: String,
    },
    images: {
      _uid: "id",
      id: String,
      src: String,
      altText: String,
      products: String,
    }
  },
}
```

It's important to note that the above data structure represents what the output will look like not what it currently is before normalization.

Collections of parent object (in this example products) can be single object and validation and format will still take place while also formatting and validating nested collections of child objects.

API RESPONSE:
```json
{
  "products": [
    {
      "id": 1,
      "title": "sample",
      "description": "sample",
      "tags": ["tag1", "tag2", "tag3"],
      "variants": {
        "title": "sample",
        "price": 20,
        "compareAtPrice": 30,
      }
    },
    {
      "id": 2,
      "title": "sample",
      "description": "sample",
      "tags": ["tag1", "tag2", "tag3"],
      "variants": [
        {
          "title": "sample",
          "price": 20,
          "compareAtPrice": 30,
        },
        {
          "title": "sample",
          "price": 20,
          "compareAtPrice": 30,
        }
      ]
    }
  ]
}
```

OUTPUT:
```js
{
  products: {
    "1": {
      id: 1,
      title: "sample",
      description: "sample",
      tags: ["tag1", "tag2", "tag3"],
      variants: ["1", "2"]
    },
    "2": {
        id: 1,
        title: "sample",
        description: "sample",
        tags: ["tag1", "tag2", "tag3"],
        variants: ["3", "4"]
    }
  },
  variants: {
    "1": {
      id: 1,
      title: "sample",
      price: 20,
      compareAtPrice: 30,
      belongsTo: 1
    },
    "2": {
      id: 2,
      title: "sample",
      price: 20,
      compareAtPrice: 30,
      belongsTo: 1
    },
    "3": {
      id: 3,
      title: "sample",
      price: 20,
      compareAtPrice: 30,
      belongsTo: 2
    }
    "4": {
      id: 4,
      title: "sample",
      price: 20,
      compareAtPrice: 30,
      belongsTo: 2
    }
  }
}
```

### Relationships

Currently relationships are pretty simple. Permute analyzes your data and if you there are nested collections, it assumes the nested collection of object are children of the parent and therefore represent a one to many relationship. This one to many relationship is represented in the example above as an array of ids on the parent under the childs property name (variants: [String] in the above example). The child has the parent's property appended to it under the parent's name (i.e. product in the above example), with the id back to the parent. Other normalization libraries use this method and claim that the array of ids can be used for all sorts of operation like sorting, filtering etc. in a much easier way than your typical iterative approach. If you use lodash you can offload the querying for all child objects to a function like (https://lodash.com/docs/4.17.15#zipObject)[zipObject]

The idea behind the dictionary output is that dictionaries are exceptionally easily to update query against. Of course, some operation are the same such as needing to perform an operation on all object in a dictionrary but at least this shape makes the majority of your typical operations O(1) instead of O(n)|O(n^2). It also makes your code state management system so much cleaner and that means easier to test and easier to maintain.

**To set up a relationship to validate that the relationship has been established**

```js
const parent = {
  child: [String]
}
```

```js
const parent = {
  child: [String, null]
}
```

## Validation

Just like a database requires you to define the types in your schema so does Permute, otherwise that data will remain unchanged. Validation happens prior to normalization and Permute validates your data by Object Data Types.


### Optional values

If you provide an array with a null value and a type the property is **optional**. You can also specify multiple types for a property by setting an array of data types i.e. [String, Number].

### Nested schemas

Like variants in the example below, if you provide a nested schema, Permute will validate the entire collection of object if variants is an Array, if not, it will validate the single object. When validation errors occur, Permute waits until the entire object has been validated and outputs all of the properties and their corresponding error so you can quickly remedy any issues.

## Testing

```
npm run test
```

