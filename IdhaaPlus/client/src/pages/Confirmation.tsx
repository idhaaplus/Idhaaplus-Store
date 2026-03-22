import { Layout } from "@/components/Layout";
import { Link } from "wouter";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function Confirmation() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"
        >
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </motion.div>
        
        <h1 className="text-4xl font-extrabold mb-4">تم استلام طلبك بنجاح!</h1>
        <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
          شكراً لتسوقك معنا. سيقوم فريقنا بتجهيز طلبك قريباً والتواصل معك لتأكيد موعد التوصيل.
        </p>

        <div className="bg-secondary rounded-3xl p-8 mb-10 text-start border border-border">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">ماذا بعد؟</h3>
              <ul className="space-y-3 text-muted-foreground list-disc list-inside ms-4">
                <li>سيتصل بك مندوب التوصيل قبل التوجه لموقعك.</li>
                <li>يرجى تجهيز المبلغ المطلوب (نقداً) للدفع عند الاستلام.</li>
                <li>تأكد من تواجدك في العنوان المحدد في وقت التوصيل المتفق عليه.</li>
              </ul>
            </div>
          </div>
        </div>

        <Link href="/">
          <a className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-foreground text-background font-bold hover:bg-foreground/90 transition-colors">
            العودة للرئيسية <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </a>
        </Link>
      </div>
    </Layout>
  );
}
