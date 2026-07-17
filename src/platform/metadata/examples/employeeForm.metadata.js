export const employeeFormMetadata = Object.freeze({
  id: "hr.employee.form",
  moduleId: "hr",
  title: "Employee",
  table: "employees",
  primaryKey: "id",
  sections: [
    {
      id: "identity",
      title: "Identity",
      columns: 2,
      fields: [
        {
          name: "emp_code",
          label: "Employee Code",
          type: "text",
          required: true,
        },
        {
          name: "full_name",
          label: "Full Name",
          type: "text",
          required: true,
        },
        {
          name: "nid",
          label: "NID",
          type: "text",
        },
        {
          name: "phone",
          label: "Phone",
          type: "phone",
        },
      ],
    },
    {
      id: "employment",
      title: "Employment",
      columns: 2,
      fields: [
        {
          name: "department",
          label: "Department",
          type: "select",
          source: "departments",
        },
        {
          name: "designation",
          label: "Designation",
          type: "text",
        },
        {
          name: "join_date",
          label: "Joining Date",
          type: "date",
        },
        {
          name: "gross_salary",
          label: "Gross Salary",
          type: "currency",
        },
      ],
    },
  ],
})
