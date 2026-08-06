import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import InvoiceTable from "@/components/dashboard/InvoiceTable";

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-muted-foreground">Manage your invoices</p>
        </div>
        <Button onClick={() => navigate("/invoices/new")}>
          <PlusIcon data-icon="inline-start" />
          New Invoice
        </Button>
      </div>

      <InvoiceTable />
    </div>
  );
}
