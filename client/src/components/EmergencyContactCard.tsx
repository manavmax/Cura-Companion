import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, Star, Edit, Trash2 } from "lucide-react"

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

interface EmergencyContactCardProps {
  contact: EmergencyContact;
  onSetPrimary: (contactId: string) => void;
  onEdit: (contact: EmergencyContact) => void;
  onDelete: (contactId: string) => void;
  onCall: (phone: string) => void;
}

export function EmergencyContactCard({ 
  contact, 
  onSetPrimary, 
  onEdit, 
  onDelete, 
  onCall 
}: EmergencyContactCardProps) {
  const handleCall = () => {
    console.log(`Calling: ${contact.phone}`)
    onCall(contact.phone)
  }

  const handleSetPrimary = () => {
    if (contact._id && !contact.isPrimary) {
      console.log(`Setting primary contact: ${contact._id}`)
      onSetPrimary(contact._id)
    }
  }

  const handleEdit = () => {
    console.log(`Editing contact: ${contact._id}`)
    onEdit(contact)
  }

  const handleDelete = () => {
    if (contact._id) {
      console.log(`Deleting contact: ${contact._id}`)
      onDelete(contact._id)
    }
  }

  return (
    <Card className="glass border-white/30 hover:border-white/50 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {contact.name}
              {contact.isPrimary && (
                <Badge variant="default" className="rounded-full text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Primary
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground capitalize">
              {contact.relationship}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0 rounded-full"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 rounded-full text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{contact.phone}</span>
          </div>
          {contact.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{contact.email}</span>
            </div>
          )}
          {contact.notes && (
            <div className="text-sm text-muted-foreground mt-2">
              <p>{contact.notes}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleCall}
            size="sm"
            className="rounded-2xl flex-1"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
          {!contact.isPrimary && (
            <Button
              variant="outline"
              onClick={handleSetPrimary}
              size="sm"
              className="rounded-2xl"
            >
              <Star className="h-4 w-4 mr-2" />
              Set Primary
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}