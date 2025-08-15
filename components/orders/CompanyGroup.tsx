import OrderCard, { OrderView } from "./OrderCard";

type Props = {
  companyName: string;
  orders: OrderView[];
  onDuplicate?: (order: OrderView) => void;
};

export default function CompanyGroup({ companyName, orders, onDuplicate }: Props) {
  return (
    <div>
      <div className="px-6 py-4 bg-gray-100">
        <h2 className="text-lg font-bold text-gray-900">{companyName}</h2>
      </div>
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} onDuplicate={onDuplicate} companyNameOverride={companyName} />
      ))}
    </div>
  );
}
