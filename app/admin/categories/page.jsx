'use client'
import { useEffect, useState } from "react"
import Loading from "@/components/Loading"
import toast from "react-hot-toast"
import { PlusIcon, EditIcon, TrashIcon, FolderIcon, ImageIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"
import Image from "next/image"
import { assets } from "@/assets/assets"

export default function AdminCategories() {
    const [categories, setCategories] = useState([])
    const [flatCategories, setFlatCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [expandedCategories, setExpandedCategories] = useState(new Set())
    const [uploadingImage, setUploadingImage] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parentId: '',
        image: null,
        thumbnail: null,
        imagePreview: null,
        isActive: true,
        displayOrder: 0
    })

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories?flat=true')
            const result = await response.json()
            if (result.success) {
                setFlatCategories(result.data)
                // Also fetch tree structure for display
                const treeResponse = await fetch('/api/categories')
                const treeResult = await treeResponse.json()
                if (treeResult.success) {
                    setCategories(treeResult.data)
                }
            } else {
                toast.error(result.error || 'Failed to fetch categories')
            }
        } catch (error) {
            toast.error('Failed to fetch categories')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category)
            setFormData({
                name: category.name,
                description: category.description || '',
                parentId: category.parentId || '',
                image: category.image,
                thumbnail: category.thumbnail,
                imagePreview: category.image || category.thumbnail,
                isActive: category.isActive,
                displayOrder: category.displayOrder
            })
        } else {
            setEditingCategory(null)
            setFormData({
                name: '',
                description: '',
                parentId: '',
                image: null,
                thumbnail: null,
                imagePreview: null,
                isActive: true,
                displayOrder: 0
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingCategory(null)
        setFormData({
            name: '',
            description: '',
            parentId: '',
            image: null,
            thumbnail: null,
            imagePreview: null,
            isActive: true,
            displayOrder: 0
        })
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB')
            return
        }

        if (!file.type.startsWith('image/')) {
            toast.error('File must be an image')
            return
        }

        setUploadingImage(true)
        try {
            const formDataToSend = new FormData()
            formDataToSend.append('image', file)

            const response = await fetch('/api/categories/upload', {
                method: 'POST',
                body: formDataToSend
            })

            const result = await response.json()
            
            if (result.success) {
                setFormData({
                    ...formData,
                    image: result.image,
                    thumbnail: result.thumbnail,
                    imagePreview: result.image
                })
                toast.success('Image uploaded successfully')
            } else {
                toast.error(result.error || 'Failed to upload image')
            }
        } catch (error) {
            toast.error('Failed to upload image')
            console.error(error)
        } finally {
            setUploadingImage(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
        const method = editingCategory ? 'PUT' : 'POST'
        const body = {
            name: formData.name,
            description: formData.description,
            parentId: formData.parentId || null,
            image: formData.image,
            thumbnail: formData.thumbnail,
            isActive: formData.isActive,
            displayOrder: parseInt(formData.displayOrder) || 0
        }

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            const result = await response.json()
            
            if (result.success) {
                toast.success(editingCategory ? 'Category updated successfully' : 'Category created successfully')
                handleCloseModal()
                fetchCategories()
            } else {
                toast.error(result.error || 'Failed to save category')
            }
        } catch (error) {
            toast.error('Failed to save category')
            console.error(error)
        }
    }

    const handleDelete = async (categoryId, categoryName) => {
        if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
            return
        }

        try {
            const response = await fetch(`/api/categories/${categoryId}`, {
                method: 'DELETE'
            })

            const result = await response.json()
            
            if (result.success) {
                toast.success('Category deleted successfully')
                fetchCategories()
            } else {
                toast.error(result.error || 'Failed to delete category')
            }
        } catch (error) {
            toast.error('Failed to delete category')
            console.error(error)
        }
    }

    const toggleExpand = (categoryId) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId)
        } else {
            newExpanded.add(categoryId)
        }
        setExpandedCategories(newExpanded)
    }

    const renderCategoryTree = (categoryList, level = 0) => {
        return categoryList.map((category) => (
            <div key={category.id} className="mb-2">
                <div 
                    className={`flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors ${level > 0 ? 'ml-6' : ''}`}
                >
                    {category.children && category.children.length > 0 && (
                        <button
                            onClick={() => toggleExpand(category.id)}
                            className="p-1 hover:bg-slate-200 rounded transition-colors"
                        >
                            {expandedCategories.has(category.id) ? (
                                <ChevronDownIcon size={16} />
                            ) : (
                                <ChevronRightIcon size={16} />
                            )}
                        </button>
                    )}
                    {(!category.children || category.children.length === 0) && (
                        <div className="w-4" />
                    )}
                    
                    {category.thumbnail && (
                        <Image
                            src={category.thumbnail}
                            alt={category.name}
                            width={40}
                            height={40}
                            className="rounded object-cover"
                        />
                    )}
                    {!category.thumbnail && (
                        <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center">
                            <FolderIcon size={20} className="text-slate-400" />
                        </div>
                    )}
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-800">{category.name}</h4>
                            {!category.isActive && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Inactive</span>
                            )}
                        </div>
                        {category.description && (
                            <p className="text-sm text-slate-500 mt-1">{category.description}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">Order: {category.displayOrder}</p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleOpenModal(category)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit category"
                        >
                            <EditIcon size={18} />
                        </button>
                        <button
                            onClick={() => handleDelete(category.id, category.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete category"
                        >
                            <TrashIcon size={18} />
                        </button>
                    </div>
                </div>
                
                {category.children && category.children.length > 0 && expandedCategories.has(category.id) && (
                    <div className="mt-2">
                        {renderCategoryTree(category.children, level + 1)}
                    </div>
                )}
            </div>
        ))
    }

    return !loading ? (
        <div className="text-slate-500 mb-28">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl">Manage <span className="text-slate-800 font-medium">Categories</span></h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                >
                    <PlusIcon size={18} />
                    Add Category
                </button>
            </div>

            {categories.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Category Tree</h3>
                    {renderCategoryTree(categories)}
                </div>
            ) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No categories available</h1>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg max-w-2xl w-full my-8">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-semibold text-slate-800">
                                {editingCategory ? 'Edit Category' : 'Create New Category'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                    placeholder="e.g., Electronics"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="Describe this category"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Parent Category
                                </label>
                                <select
                                    value={formData.parentId}
                                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="">None (Top-level category)</option>
                                    {flatCategories
                                        .filter(cat => !editingCategory || cat.id !== editingCategory.id)
                                        .map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Category Image
                                </label>
                                <div className="flex items-center gap-4">
                                    {formData.imagePreview && (
                                        <div className="relative">
                                            <Image
                                                src={formData.imagePreview}
                                                alt="Preview"
                                                width={100}
                                                height={100}
                                                className="rounded object-cover border border-slate-200"
                                            />
                                        </div>
                                    )}
                                    <label className="cursor-pointer">
                                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-green-500 transition-colors flex flex-col items-center gap-2">
                                            <ImageIcon size={24} className="text-slate-400" />
                                            <span className="text-sm text-slate-600">
                                                {formData.imagePreview ? 'Change Image' : 'Upload Image'}
                                            </span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={uploadingImage}
                                        />
                                    </label>
                                </div>
                                {uploadingImage && (
                                    <p className="text-sm text-slate-500 mt-2">Uploading image...</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Display Order
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.displayOrder}
                                        onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        min="0"
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-6">
                                    <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                        <span className="dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                                    </label>
                                    <span className="text-sm font-medium text-slate-700">Active</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    disabled={uploadingImage}
                                >
                                    {editingCategory ? 'Update Category' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    ) : <Loading />
}

