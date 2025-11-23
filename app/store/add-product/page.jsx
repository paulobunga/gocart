'use client'
import { assets } from "@/assets/assets"
import Image from "next/image"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { PlusIcon, XIcon, TrashIcon } from "lucide-react"
import Loading from "@/components/Loading"

export default function StoreAddProduct() {
    const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']

    const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })
    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        mrp: 0,
        price: 0,
        category: "",
        productType: "SIMPLE",
    })
    const [loading, setLoading] = useState(false)
    const [attributes, setAttributes] = useState([])
    const [selectedAttributes, setSelectedAttributes] = useState([])
    const [variants, setVariants] = useState([])
    const [loadingAttributes, setLoadingAttributes] = useState(true)
    const [storeId, setStoreId] = useState(null)

    useEffect(() => {
        fetchAttributes()
        fetchStoreId()
    }, [])

    const fetchStoreId = async () => {
        try {
            const response = await fetch('/api/stores')
            const result = await response.json()
            if (result.success && result.data.length > 0) {
                setStoreId(result.data[0].id)
            }
        } catch (error) {
            console.error('Error fetching store:', error)
        }
    }

    const fetchAttributes = async () => {
        try {
            const response = await fetch('/api/attributes?includeValues=true')
            const result = await response.json()
            if (result.success) {
                setAttributes(result.data)
            }
        } catch (error) {
            console.error('Error fetching attributes:', error)
        } finally {
            setLoadingAttributes(false)
        }
    }

    const onChangeHandler = (e) => {
        setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
    }

    const handleProductTypeChange = (type) => {
        setProductInfo({ ...productInfo, productType: type })
        if (type === 'SIMPLE') {
            setSelectedAttributes([])
            setVariants([])
        }
    }

    const handleAttributeToggle = (attributeId) => {
        if (selectedAttributes.includes(attributeId)) {
            setSelectedAttributes(selectedAttributes.filter(id => id !== attributeId))
            // Remove variants that use this attribute
            setVariants(variants.map(variant => {
                const newAttributeValues = variant.attributeValues.filter(
                    valueId => {
                        const value = attributes
                            .find(a => a.id === attributeId)
                            ?.values?.find(v => v.id === valueId)
                        return !value
                    }
                )
                return { ...variant, attributeValues: newAttributeValues }
            }).filter(v => v.attributeValues.length > 0))
        } else {
            setSelectedAttributes([...selectedAttributes, attributeId])
        }
    }

    const generateVariants = async () => {
        if (selectedAttributes.length === 0) {
            toast.error('Please select at least one attribute')
            return
        }

        try {
            // Create a temporary product to generate variants
            // In a real scenario, you might want to generate combinations client-side
            const selectedAttributeObjects = attributes.filter(a => selectedAttributes.includes(a.id))
            const attributeValueArrays = selectedAttributeObjects.map(attr => 
                attr.values?.map(v => v.id) || []
            )

            // Generate all combinations
            const combinations = generateCombinations(attributeValueArrays)
            
            // Create variant objects
            const newVariants = combinations.map(combination => ({
                attributeValues: combination,
                mrp: productInfo.mrp,
                price: productInfo.price,
                stock: 0,
                inStock: true,
                sku: '',
                images: [],
            }))

            setVariants(newVariants)
            toast.success(`Generated ${newVariants.length} variant combinations`)
        } catch (error) {
            console.error('Error generating variants:', error)
            toast.error('Failed to generate variants')
        }
    }

    const generateCombinations = (arrays) => {
        if (arrays.length === 0) return []
        if (arrays.length === 1) return arrays[0].map(v => [v])

        const [first, ...rest] = arrays
        const restCombinations = generateCombinations(rest)
        const combinations = []

        for (const value of first) {
            for (const combination of restCombinations) {
                combinations.push([value, ...combination])
            }
        }

        return combinations
    }

    const updateVariant = (index, field, value) => {
        const updated = [...variants]
        updated[index] = { ...updated[index], [field]: value }
        setVariants(updated)
    }

    const removeVariant = (index) => {
        setVariants(variants.filter((_, i) => i !== index))
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!storeId) {
                toast.error('Store not found')
                return
            }

            // Upload images first
            const imageUrls = []
            for (const key in images) {
                if (images[key]) {
                    const formData = new FormData()
                    formData.append('file', images[key])
                    // You'll need to implement image upload API
                    // For now, we'll skip image upload and use placeholder
                    // const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData })
                    // const uploadResult = await uploadResponse.json()
                    // imageUrls.push(uploadResult.url)
                }
            }

            const productData = {
                ...productInfo,
                storeId,
                images: imageUrls,
                mrp: parseFloat(productInfo.mrp),
                price: parseFloat(productInfo.price),
                ...(productInfo.productType === 'COMPLEX' && {
                    attributes: selectedAttributes,
                    variants: variants.map(v => ({
                        ...v,
                        mrp: parseFloat(v.mrp) || parseFloat(productInfo.mrp),
                        price: parseFloat(v.price) || parseFloat(productInfo.price),
                        stock: parseInt(v.stock) || 0,
                    })),
                }),
            }

            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
            })

            const result = await response.json()
            if (result.success) {
                toast.success('Product created successfully!')
                // Reset form
                setProductInfo({
                    name: "",
                    description: "",
                    mrp: 0,
                    price: 0,
                    category: "",
                    productType: "SIMPLE",
                })
                setImages({ 1: null, 2: null, 3: null, 4: null })
                setSelectedAttributes([])
                setVariants([])
            } else {
                toast.error(result.error || 'Failed to create product')
            }
        } catch (error) {
            console.error('Error creating product:', error)
            toast.error('Failed to create product')
        } finally {
            setLoading(false)
        }
    }

    const getVariantDisplayName = (variant) => {
        const selectedAttributeObjects = attributes.filter(a => selectedAttributes.includes(a.id))
        return variant.attributeValues.map(valueId => {
            for (const attr of selectedAttributeObjects) {
                const value = attr.values?.find(v => v.id === valueId)
                if (value) {
                    return `${attr.displayName}: ${value.displayValue || value.value}`
                }
            }
            return ''
        }).filter(Boolean).join(', ')
    }

    if (loadingAttributes) return <Loading />

    return (
        <form onSubmit={e => toast.promise(onSubmitHandler(e), { loading: "Adding Product..." })} className="text-slate-500 mb-28">
            <h1 className="text-2xl">Add New <span className="text-slate-800 font-medium">Product</span></h1>

            {/* Product Type Selection */}
            <div className="my-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Product Type</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="productType"
                            value="SIMPLE"
                            checked={productInfo.productType === 'SIMPLE'}
                            onChange={(e) => handleProductTypeChange(e.target.value)}
                            className="w-4 h-4"
                        />
                        <span>Simple Product</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="productType"
                            value="COMPLEX"
                            checked={productInfo.productType === 'COMPLEX'}
                            onChange={(e) => handleProductTypeChange(e.target.value)}
                            className="w-4 h-4"
                        />
                        <span>Complex Product (with Variants)</span>
                    </label>
                </div>
            </div>

            <p className="mt-7">Product Images</p>
            <div className="flex gap-3 mt-4">
                {Object.keys(images).map((key) => (
                    <label key={key} htmlFor={`images${key}`}>
                        <Image width={300} height={300} className='h-15 w-auto border border-slate-200 rounded cursor-pointer' src={images[key] ? URL.createObjectURL(images[key]) : assets.upload_area} alt="" />
                        <input type="file" accept='image/*' id={`images${key}`} onChange={e => setImages({ ...images, [key]: e.target.files[0] })} hidden />
                    </label>
                ))}
            </div>

            <label className="flex flex-col gap-2 my-6">
                Name
                <input type="text" name="name" onChange={onChangeHandler} value={productInfo.name} placeholder="Enter product name" className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" required />
            </label>

            <label className="flex flex-col gap-2 my-6">
                Description
                <textarea name="description" onChange={onChangeHandler} value={productInfo.description} placeholder="Enter product description" rows={5} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
            </label>

            <div className="flex gap-5">
                <label className="flex flex-col gap-2">
                    Actual Price ($)
                    <input type="number" name="mrp" onChange={onChangeHandler} value={productInfo.mrp} placeholder="0" className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded" required />
                </label>
                <label className="flex flex-col gap-2">
                    Offer Price ($)
                    <input type="number" name="price" onChange={onChangeHandler} value={productInfo.price} placeholder="0" className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded" required />
                </label>
            </div>

            <select onChange={e => setProductInfo({ ...productInfo, category: e.target.value })} value={productInfo.category} className="w-full max-w-sm p-2 px-4 my-6 outline-none border border-slate-200 rounded" required>
                <option value="">Select a category</option>
                {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                ))}
            </select>

            {/* Complex Product Attributes & Variants */}
            {productInfo.productType === 'COMPLEX' && (
                <div className="my-6 p-6 bg-slate-50 rounded-lg border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Product Attributes</h3>
                    
                    {attributes.length === 0 ? (
                        <p className="text-sm text-slate-500 mb-4">No attributes available. Please create attributes in the admin panel first.</p>
                    ) : (
                        <>
                            <div className="space-y-2 mb-4">
                                {attributes.map((attribute) => (
                                    <label key={attribute.id} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedAttributes.includes(attribute.id)}
                                            onChange={() => handleAttributeToggle(attribute.id)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-slate-700">{attribute.displayName}</span>
                                        {selectedAttributes.includes(attribute.id) && (
                                            <span className="text-xs text-slate-500">
                                                ({attribute.values?.length || 0} values)
                                            </span>
                                        )}
                                    </label>
                                ))}
                            </div>

                            {selectedAttributes.length > 0 && (
                                <div className="mt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-md font-semibold text-slate-800">Variants</h4>
                                        <button
                                            type="button"
                                            onClick={generateVariants}
                                            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition text-sm"
                                        >
                                            <PlusIcon size={16} />
                                            Generate All Variants
                                        </button>
                                    </div>

                                    {variants.length > 0 ? (
                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                            {variants.map((variant, index) => (
                                                <div key={index} className="p-4 bg-white border border-slate-200 rounded-lg">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-slate-800">
                                                                {getVariantDisplayName(variant) || `Variant ${index + 1}`}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeVariant(index)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        >
                                                            <TrashIcon size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs text-slate-600 mb-1">MRP</label>
                                                            <input
                                                                type="number"
                                                                value={variant.mrp}
                                                                onChange={(e) => updateVariant(index, 'mrp', e.target.value)}
                                                                className="w-full p-2 border border-slate-200 rounded text-sm"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-slate-600 mb-1">Price</label>
                                                            <input
                                                                type="number"
                                                                value={variant.price}
                                                                onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                                                className="w-full p-2 border border-slate-200 rounded text-sm"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-slate-600 mb-1">Stock</label>
                                                            <input
                                                                type="number"
                                                                value={variant.stock}
                                                                onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                                                                className="w-full p-2 border border-slate-200 rounded text-sm"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-slate-600 mb-1">SKU (optional)</label>
                                                            <input
                                                                type="text"
                                                                value={variant.sku}
                                                                onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                                                className="w-full p-2 border border-slate-200 rounded text-sm"
                                                                placeholder="SKU-001"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="mt-3">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={variant.inStock}
                                                                onChange={(e) => updateVariant(index, 'inStock', e.target.checked)}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-sm text-slate-700">In Stock</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">Click "Generate All Variants" to create variant combinations</p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <br />
            <button disabled={loading} className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition">
                {loading ? 'Creating...' : 'Add Product'}
            </button>
        </form>
    )
}
