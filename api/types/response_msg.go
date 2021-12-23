// Code generated by go-swagger; DO NOT EDIT.

package types

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"

	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
)

// ResponseMsg response msg
//
// swagger:model ResponseMsg
type ResponseMsg struct {

	// message
	Message string `json:"message,omitempty"`
}

// Validate validates this response msg
func (m *ResponseMsg) Validate(formats strfmt.Registry) error {
	return nil
}

// ContextValidate validates this response msg based on context it is used
func (m *ResponseMsg) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	return nil
}

// MarshalBinary interface implementation
func (m *ResponseMsg) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *ResponseMsg) UnmarshalBinary(b []byte) error {
	var res ResponseMsg
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}