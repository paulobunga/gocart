'use client'
import { useEffect, useState } from "react"
import Loading from "@/components/Loading"
import toast from "react-hot-toast"
import { PlusIcon, EditIcon, TrashIcon, ShieldCheckIcon } from "lucide-react"

export default function AdminRoles() {
    const [roles, setRoles] = useState([])
    const [permissions, setPermissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingRole, setEditingRole] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissionIds: []
    })

    const fetchRoles = async () => {
        try {
            const response = await fetch('/api/roles')
            const result = await response.json()
            if (result.success) {
                setRoles(result.data)
            } else {
                toast.error(result.error || 'Failed to fetch roles')
            }
        } catch (error) {
            toast.error('Failed to fetch roles')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const fetchPermissions = async () => {
        try {
            const response = await fetch('/api/permissions')
            const result = await response.json()
            if (result.success) {
                setPermissions(result.data)
            }
        } catch (error) {
            console.error('Failed to fetch permissions:', error)
        }
    }

    useEffect(() => {
        fetchRoles()
        fetchPermissions()
    }, [])

    const handleOpenModal = (role = null) => {
        if (role) {
            setEditingRole(role)
            setFormData({
                name: role.name,
                description: role.description || '',
                permissionIds: role.permissions.map(p => p.id)
            })
        } else {
            setEditingRole(null)
            setFormData({
                name: '',
                description: '',
                permissionIds: []
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingRole(null)
        setFormData({
            name: '',
            description: '',
            permissionIds: []
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        const url = editingRole ? '/api/roles' : '/api/roles'
        const method = editingRole ? 'PUT' : 'POST'
        const body = editingRole 
            ? { id: editingRole.id, ...formData }
            : formData

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            const result = await response.json()
            
            if (result.success) {
                toast.success(editingRole ? 'Role updated successfully' : 'Role created successfully')
                handleCloseModal()
                fetchRoles()
            } else {
                toast.error(result.error || 'Failed to save role')
            }
        } catch (error) {
            toast.error('Failed to save role')
            console.error(error)
        }
    }

    const handleDelete = async (roleId, roleName) => {
        if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
            return
        }

        try {
            const response = await fetch(`/api/roles?id=${roleId}`, {
                method: 'DELETE'
            })

            const result = await response.json()
            
            if (result.success) {
                toast.success('Role deleted successfully')
                fetchRoles()
            } else {
                toast.error(result.error || 'Failed to delete role')
            }
        } catch (error) {
            toast.error('Failed to delete role')
            console.error(error)
        }
    }

    const togglePermission = (permissionId) => {
        setFormData(prev => ({
            ...prev,
            permissionIds: prev.permissionIds.includes(permissionId)
                ? prev.permissionIds.filter(id => id !== permissionId)
                : [...prev.permissionIds, permissionId]
        }))
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
                <h1 className="text-2xl">Roles & <span className="text-slate-800 font-medium">Permissions</span></h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                >
                    <PlusIcon size={18} />
                    Add Role
                </button>
            </div>

            {roles.length ? (
                <div className="flex flex-col gap-4 mt-4">
                    {roles.map((role) => (
                        <div key={role.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                            <div className="flex items-start justify-between max-md:flex-col gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ShieldCheckIcon size={20} className="text-slate-600" />
                                        <h3 className="text-xl font-semibold text-slate-800">{role.name}</h3>
                                        <span className="text-sm text-slate-400">({role.userCount} users)</span>
                                    </div>
                                    {role.description && (
                                        <p className="text-slate-600 mb-4">{role.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {role.permissions.map((perm) => (
                                            <span
                                                key={perm.id}
                                                className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded"
                                            >
                                                {perm.resource}:{perm.action}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenModal(role)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit role"
                                    >
                                        <EditIcon size={18} />
                                    </button>
                                    {!['Admin', 'Vendor', 'Customer'].includes(role.name) && (
                                        <button
                                            onClick={() => handleDelete(role.id, role.name)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete role"
                                        >
                                            <TrashIcon size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No roles available</h1>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-semibold text-slate-800">
                                {editingRole ? 'Edit Role' : 'Create New Role'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Role Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                    disabled={editingRole && ['Admin', 'Vendor', 'Customer'].includes(editingRole.name)}
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
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-3">
                                    Permissions
                                </label>
                                <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg p-4">
                                    {Object.entries(groupedPermissions).map(([resource, perms]) => (
                                        <div key={resource} className="mb-4">
                                            <h4 className="font-semibold text-slate-700 mb-2 capitalize">{resource}</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {perms.map((perm) => (
                                                    <label
                                                        key={perm.id}
                                                        className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.permissionIds.includes(perm.id)}
                                                            onChange={() => togglePermission(perm.id)}
                                                            className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                                                        />
                                                        <span className="text-sm text-slate-700">{perm.action}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
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
                                >
                                    {editingRole ? 'Update Role' : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    ) : <Loading />
}

