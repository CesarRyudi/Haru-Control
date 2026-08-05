import React, { useState, useEffect } from "react";
import { Customer } from "@haru-control/types";
import api from "../services/api";
import "../pages/Customers.css"; // Reuse modal styles

interface CustomerFormModalProps {
  editingCustomer?: Customer | null;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
}

export default function CustomerFormModal({ editingCustomer, onClose, onSuccess }: CustomerFormModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [observation, setObservation] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name);
      setPhone(editingCustomer.phone || "");
      setAddress(editingCustomer.address || "");
      setObservation(editingCustomer.observation || "");
    }
  }, [editingCustomer]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 9) {
      value = `${value.slice(0, 10)}-${value.slice(10)}`;
    }
    setPhone(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setFormLoading(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        observation: observation.trim() || undefined,
      };

      let response;
      if (editingCustomer) {
        response = await api.patch(`/customers/${editingCustomer.id}`, payload);
      } else {
        response = await api.post("/customers", payload);
      }
      
      onSuccess(response.data);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Ocorreu um erro ao salvar o cliente.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{editingCustomer ? "Editar Cliente" : "Novo Cliente"}</h2>
        
        <form onSubmit={handleSubmit} className="customer-form">
          <div className="form-group">
            <label>Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João Silva"
              required
            />
          </div>

          <div className="form-group">
            <label>Telefone</label>
            <input
              type="text"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="Ex: (11) 99999-9999"
              maxLength={15}
            />
          </div>

          <div className="form-group">
            <label>Endereço de Entrega</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, Número, Bairro, Referência..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Observação (Opcional)</label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Alergias, preferências, etc..."
              rows={2}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={formLoading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={formLoading}>
              {formLoading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
