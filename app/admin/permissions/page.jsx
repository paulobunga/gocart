'use client'
import { useEffect, useState } from "react"
import Loading from "@/components/Loading"
import toast from "react-hot-toast"
import { PlusIcon, EditIcon, TrashIcon, KeyIcon } from "lucide-react"

export default function AdminPermissions() {
    const [permissions, setPermissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingPermission, setEditingPermission] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        resource: '',
        action: '',
        description: ''
    })

    const resources = [
        'admin', 'users', 'stores', 'products', 'orders', 
        'coupons', 'roles', 'cart', 'address', 'ratings', 'analytics'
    ]

    const actions = [
        'create', 'read', 'update', 'delete', 'manage', 'approve'
    ]

    const fetchPermissions = async () => {
        try {
            const response = await fetch('/api/permissions')
            const result = await response.json()
            if (result.success) {
                setPermissions(result.data)
            } else {
                toast.error(result.error || 'Failed to fetch permissions')
            }
        } catch (error) {
            toast.error('Failed to fetch permissions')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPermissions()
    }, [])

    const handleOpenModal = (permission = null) => {
        if (permission) {
            setEditingPermission(permission)
            setFormData({
                name: permission.name,
                resource: permission.resource,
                action: permission.action,
                description: permission.description || ''
            })
        } else {
            setEditingPermission(null)
            setFormData({
                name: '',
                resource: '',
                action: '',
                description: ''
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingPermission(null)
        setFormData({
            name: '',
            resource: '',
            action: '',
            description: ''
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        const url = '/api/permissions'
        const method = editingPermission ? 'PUT' : 'POST'
        const body = editingPermission 
            ? { id: editingPermission.id, ...formData }
            : formData

        // Auto-generate name if not provided
        if (!body.name && body.resource && body.action) {
            body.name = `${body.resource}.${body.action}`
        }

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            const result = await response.json()
            
            if (result.success) {
                toast.success(editingPermission ? 'Permission updated successfully' : 'Permission created successfully')
                handleCloseModal()
                fetchPermissions()
            } else {
                toast.error(result.error || 'Failed to save permission')
            }
        } catch (error) {
            toast.error('Failed to save permission')
            console.error(error)
        }
    }

    const handleDelete = async (permissionId, permissionName) => {
        if (!confirm(`Are you sure you want to delete the permission "${permissionName}"?`)) {
            return
        }

        try {
            const response = await fetch(`/api/permissions?id=${permissionId}`, {
                method: 'DELETE'
            })

            const result = await response.json()
            
            if (result.success) {
                toast.success('Permission deleted successfully')
                fetchPermissions()
            } else {
                toast.error(result.error || 'Failed to delete permission')
            }
        } catch (error) {
            toast.error('Failed to delete permission')
            console.error(error)
        }
    }

    const groupedPermissions = permissions.reduce((acc, perm) => {
        if (!acc[perm.resource]) {
            acc[perm.resource] = []
        }
        acc[perm.resource].push(perm)
        return acc
    }, {})

    return !loading ? (
        <div className="text-slate-500 mb-28">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl">Manage <span className="text-slate-800 font-medium">Permissions</span></h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                >
                    <PlusIcon size={18} />
                    Add Permission
                </button>
            </div>

            {Object.keys(groupedPermissions).length > 0 ? (
                <div className="flex flex-col gap-6 mt-4">
                    {Object.entries(groupedPermissions).map(([resource, perms]) => (
                        <div key={resource} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4 capitalize flex items-center gap-2">
                                <KeyIcon size={18} />
                                {resource}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {perms.map((perm) => (
                                    <div
                                        key={perm.id}
                                        className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-slate-800">{perm.name}</h4>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {perm.resource}:{perm.action}
                                                </p>
                                                {perm.description && (
                                                    <p className="text-xs text-slate-400 mt-2">{perm.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleOpenModal(perm)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit permission"
                                                >
                                                    <EditIcon size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(perm.id, perm.name)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete permission"
                                                >
                                                    <TrashIcon size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-2">
                                            Used by {perm.roleCount} role(s)
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No permissions available</h1>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-semibold text-slate-800">
                                {editingPermission ? 'Edit Permission' : 'Create New Permission'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Permission Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                    placeholder="e.g., products.create"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Resource *
                                    </label>
                                    <select
                                        value={formData.resource}
                                        onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Select resource</option>
                                        {resources.map((res) => (
                                            <option key={res} value={res}>
                                                {res}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Action *
                                    </label>
                                    <select
                                        value={formData.action}
                                        onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Select action</option>
                                        {actions.map((act) => (
                                            <option key={act} value={act}>
                                                {act}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="Describe what this permission allows"
                                />
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
                                >
                                    {editingPermission ? 'Update Permission' : 'Create Permission'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    ) : <Loading />
}

