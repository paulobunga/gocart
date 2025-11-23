'use client'
import { useEffect, useState } from "react"
import Loading from "@/components/Loading"
import toast from "react-hot-toast"
import { TagIcon, PlusIcon, EditIcon, TrashIcon, XIcon, CheckIcon } from "lucide-react"

export default function AdminAttributes() {
    const [attributes, setAttributes] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddAttribute, setShowAddAttribute] = useState(false)
    const [showAddValue, setShowAddValue] = useState(null) // attributeId
    const [editingAttribute, setEditingAttribute] = useState(null)
    const [editingValue, setEditingValue] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        displayName: '',
        description: '',
    })
    const [valueFormData, setValueFormData] = useState({
        value: '',
        displayValue: '',
    })

    const fetchAttributes = async () => {
        try {
            const response = await fetch('/api/attributes?includeValues=true')
            const result = await response.json()
            if (result.success) {
                setAttributes(result.data)
            } else {
                toast.error(result.error || 'Failed to fetch attributes')
            }
        } catch (error) {
            console.error('Error fetching attributes:', error)
            toast.error('Failed to fetch attributes')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateAttribute = async (e) => {
        e.preventDefault()
        try {
            const response = await fetch('/api/attributes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            const result = await response.json()
            if (result.success) {
                toast.success('Attribute created successfully')
                setShowAddAttribute(false)
                setFormData({ name: '', displayName: '', description: '' })
                fetchAttributes()
            } else {
                toast.error(result.error || 'Failed to create attribute')
            }
        } catch (error) {
            console.error('Error creating attribute:', error)
            toast.error('Failed to create attribute')
        }
    }

    const handleUpdateAttribute = async (e) => {
        e.preventDefault()
        try {
            const response = await fetch(`/api/attributes/${editingAttribute.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            const result = await response.json()
            if (result.success) {
                toast.success('Attribute updated successfully')
                setEditingAttribute(null)
                setFormData({ name: '', displayName: '', description: '' })
                fetchAttributes()
            } else {
                toast.error(result.error || 'Failed to update attribute')
            }
        } catch (error) {
            console.error('Error updating attribute:', error)
            toast.error('Failed to update attribute')
        }
    }

    const handleDeleteAttribute = async (attributeId) => {
        if (!confirm('Are you sure you want to delete this attribute?')) return

        try {
            const response = await fetch(`/api/attributes/${attributeId}`, {
                method: 'DELETE',
            })

            const result = await response.json()
            if (result.success) {
                toast.success('Attribute deleted successfully')
                fetchAttributes()
            } else {
                toast.error(result.error || 'Failed to delete attribute')
            }
        } catch (error) {
            console.error('Error deleting attribute:', error)
            toast.error('Failed to delete attribute')
        }
    }

    const handleCreateValue = async (e, attributeId) => {
        e.preventDefault()
        try {
            const response = await fetch(`/api/attributes/${attributeId}/values`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(valueFormData),
            })

            const result = await response.json()
            if (result.success) {
                toast.success('Attribute value created successfully')
                setShowAddValue(null)
                setValueFormData({ value: '', displayValue: '' })
                fetchAttributes()
            } else {
                toast.error(result.error || 'Failed to create attribute value')
            }
        } catch (error) {
            console.error('Error creating attribute value:', error)
            toast.error('Failed to create attribute value')
        }
    }

    const handleUpdateValue = async (e, valueId) => {
        e.preventDefault()
        try {
            const response = await fetch(`/api/attributes/values/${valueId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(valueFormData),
            })

            const result = await response.json()
            if (result.success) {
                toast.success('Attribute value updated successfully')
                setEditingValue(null)
                setValueFormData({ value: '', displayValue: '' })
                fetchAttributes()
            } else {
                toast.error(result.error || 'Failed to update attribute value')
            }
        } catch (error) {
            console.error('Error updating attribute value:', error)
            toast.error('Failed to update attribute value')
        }
    }

    const handleDeleteValue = async (valueId) => {
        if (!confirm('Are you sure you want to delete this value?')) return

        try {
            const response = await fetch(`/api/attributes/values/${valueId}`, {
                method: 'DELETE',
            })

            const result = await response.json()
            if (result.success) {
                toast.success('Attribute value deleted successfully')
                fetchAttributes()
            } else {
                toast.error(result.error || 'Failed to delete attribute value')
            }
        } catch (error) {
            console.error('Error deleting attribute value:', error)
            toast.error('Failed to delete attribute value')
        }
    }

    const startEditAttribute = (attribute) => {
        setEditingAttribute(attribute)
        setFormData({
            name: attribute.name,
            displayName: attribute.displayName || attribute.name,
            description: attribute.description || '',
        })
        setShowAddAttribute(true)
    }

    const startEditValue = (value) => {
        setEditingValue(value)
        setValueFormData({
            value: value.value,
            displayValue: value.displayValue || value.value,
        })
    }

    useEffect(() => {
        fetchAttributes()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-40">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <TagIcon size={24} className="text-slate-800" />
                    <h2 className="text-2xl">
                        Product <span className="text-slate-800 font-medium">Attributes</span>
                    </h2>
                </div>
                <button
                    onClick={() => {
                        setShowAddAttribute(true)
                        setEditingAttribute(null)
                        setFormData({ name: '', displayName: '', description: '' })
                    }}
                    className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition"
                >
                    <PlusIcon size={18} />
                    Add Attribute
                </button>
            </div>

            {/* Add/Edit Attribute Form */}
            {showAddAttribute && (
                <div className="mb-6 bg-white border border-slate-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-slate-800">
                            {editingAttribute ? 'Edit Attribute' : 'Add New Attribute'}
                        </h3>
                        <button
                            onClick={() => {
                                setShowAddAttribute(false)
                                setEditingAttribute(null)
                                setFormData({ name: '', displayName: '', description: '' })
                            }}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <XIcon size={20} />
                        </button>
                    </div>
                    <form onSubmit={editingAttribute ? handleUpdateAttribute : handleCreateAttribute}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Attribute Name (Internal) *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., size, color, material"
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    required
                                    disabled={!!editingAttribute}
                                />
                                <p className="text-xs text-slate-400 mt-1">Used internally, lowercase, no spaces</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Display Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    placeholder="e.g., Size, Color, Material"
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description"
                                    rows={3}
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition"
                                >
                                    {editingAttribute ? 'Update' : 'Create'} Attribute
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddAttribute(false)
                                        setEditingAttribute(null)
                                        setFormData({ name: '', displayName: '', description: '' })
                                    }}
                                    className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Attributes List */}
            <div className="space-y-4">
                {attributes.map((attribute) => (
                    <div key={attribute.id} className="bg-white border border-slate-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">{attribute.displayName}</h3>
                                {attribute.description && (
                                    <p className="text-sm text-slate-500 mt-1">{attribute.description}</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => startEditAttribute(attribute)}
                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                >
                                    <EditIcon size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteAttribute(attribute.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
                                    <TrashIcon size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Values List */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-medium text-slate-700">Values</h4>
                                <button
                                    onClick={() => {
                                        setShowAddValue(attribute.id)
                                        setEditingValue(null)
                                        setValueFormData({ value: '', displayValue: '' })
                                    }}
                                    className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
                                >
                                    <PlusIcon size={14} />
                                    Add Value
                                </button>
                            </div>

                            {/* Add/Edit Value Form */}
                            {showAddValue === attribute.id && (
                                <div className="mb-3 p-4 bg-slate-50 rounded-lg">
                                    <form onSubmit={(e) => editingValue ? handleUpdateValue(e, editingValue.id) : handleCreateValue(e, attribute.id)}>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={valueFormData.value}
                                                onChange={(e) => setValueFormData({ ...valueFormData, value: e.target.value })}
                                                placeholder="Value (e.g., Small, Red)"
                                                className="flex-1 p-2 border border-slate-200 rounded-lg"
                                                required
                                            />
                                            <input
                                                type="text"
                                                value={valueFormData.displayValue}
                                                onChange={(e) => setValueFormData({ ...valueFormData, displayValue: e.target.value })}
                                                placeholder="Display Value (optional)"
                                                className="flex-1 p-2 border border-slate-200 rounded-lg"
                                            />
                                            <button
                                                type="submit"
                                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                            >
                                                <CheckIcon size={18} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAddValue(null)
                                                    setEditingValue(null)
                                                    setValueFormData({ value: '', displayValue: '' })
                                                }}
                                                className="p-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
                                            >
                                                <XIcon size={18} />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {attribute.values && attribute.values.length > 0 ? (
                                    attribute.values.map((value) => (
                                        <div
                                            key={value.id}
                                            className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg"
                                        >
                                            <span className="text-sm text-slate-700">
                                                {value.displayValue || value.value}
                                            </span>
                                            <button
                                                onClick={() => startEditValue(value)}
                                                className="text-slate-500 hover:text-slate-700"
                                            >
                                                <EditIcon size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteValue(value.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <TrashIcon size={14} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400">No values added yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {attributes.length === 0 && (
                    <div className="text-center py-12 bg-white border border-slate-200 rounded-lg">
                        <TagIcon size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">No attributes created yet</p>
                        <p className="text-sm text-slate-400 mt-2">Create your first attribute to get started</p>
                    </div>
                )}
            </div>
        </div>
    )
}

