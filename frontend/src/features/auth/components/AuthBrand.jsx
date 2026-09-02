import { Package } from "lucide-react";
import { authLogo } from "../services/authContent";

export function AuthBrand({
  logo = "gradient",
  textColor = "text-gray-900",
}) {
  return (
    <div className="flex items-center gap-3">
      {logo === "image" ? (
        <img
          src={authLogo}
          alt="GOD'S EYES SAS logo"
          className="h-12 w-12 flex-shrink-0 rounded-full object-contain"
        />
      ) : (
        <div className="w-12 h-12 bg-gradient-to-br from-[#433A9B] to-[#F39A3D] rounded-lg flex items-center justify-center">
          <Package className="w-7 h-7 text-white" />
        </div>
      )}
      <span className={`text-2xl font-bold ${textColor}`}>BGoat ERP</span>
    </div>
  );
}
