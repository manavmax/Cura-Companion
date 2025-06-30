import * as React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/useToast"
import { Plus, Save, X } from "lucide-react"

interface EmergencyContact {
  _id?: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmergencyContactFormProps {
  contact?: EmergencyContact | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Partial<EmergencyContact>) => Promise<void>;
  isEditing?: boolean;
}

export function EmergencyContactForm({ 
  contact, 
  isOpen, 
  onClose, 
  onSave, 
  isEditing = false 
}: EmergencyContactFormProps) {
  const [formData, setFormData] = React.useState<Partial<EmergencyContact>>({
    name: contact?.name || '',
    relationship: contact?.relationship || '',
    phone: contact?.phone || '',
    email: contact?.email || '',
    notes: contact?.notes || ''
  })
  const [saving, setSaving] = React.useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.relationship || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Name, Relationship, Phone)",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      console.log(`${isEditing ? 'Updating' : 'Creating'} emergency contact:`, formData)
      await onSave(formData)
      handleClose()
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} emergency contact:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} emergency contact`,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      relationship: '',
      phone: '',
      email: '',
      notes: ''
    })
    onClose()
  }

  const updateField = (field: keyof EmergencyContact, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Save className="h-5 w-5 text-primary" />
                Edit Emergency Contact
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-primary" />
                Add Emergency Contact
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the emergency contact information."
              : "Add a new emergency contact who can be reached during crisis situations."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact-name"
                value={formData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                className="rounded-2xl"
                placeholder="Enter contact name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact-relationship">
                Relationship <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact-relationship"
                value={formData.relationship || ''}
                onChange={(e) => updateField('relationship', e.target.value)}
                className="rounded-2xl"
                placeholder="e.g., Family, Friend, Therapist"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact-phone">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact-phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                className="rounded-2xl"
                placeholder="Enter phone number"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                className="rounded-2xl"
                placeholder="Enter email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact-notes">Notes</Label>
              <Input
                id="contact-notes"
                value={formData.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                className="rounded-2xl"
                placeholder="Additional notes (optional)"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="rounded-2xl"
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-2xl"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  {isEditing ? 'Updating...' : 'Adding...'}
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Contact' : 'Add Contact'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}