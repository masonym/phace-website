[Catalog Object](https://developer.squareup.com/reference/square/objects/CatalogObject)

CatalogItem and CatalogItemVariation are CatalogObjects; union types

CatalogItem and CatalogItemVariation are used to represent items in Square's Catalog API. They are both part of the CatalogObject, which is a generic object that can represent various types of data in Square's system.


### Image IDs

It seems as if both CatalogItem and CatalogItemVariation have an image_ids property. This property is an array of strings that represent the IDs of images associated with the item or variation. These image IDs can be used to retrieve the actual images from Square's Image API.

These are on the itemData and itemVariationData fields respectively.
