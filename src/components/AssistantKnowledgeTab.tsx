import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Download, Trash2, Database } from "lucide-react";
import { KnowledgeFile } from "@/types/assistant";

interface AssistantKnowledgeTabProps {
  knowledgeFiles: KnowledgeFile[];
  addKnowledgeFile: () => void;
  removeKnowledgeFile: (index: number) => void;
}

export default function AssistantKnowledgeTab({
  knowledgeFiles,
  addKnowledgeFile,
  removeKnowledgeFile
}: AssistantKnowledgeTabProps) {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-xl rounded-2xl">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Base de Conhecimento
            </span>
          </CardTitle>
          <Button 
            onClick={addKnowledgeFile}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-11 px-6 rounded-xl shadow-lg"
          >
            <Upload className="w-4 h-4 mr-2" />
            Fazer Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {knowledgeFiles.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">Nenhum arquivo carregado</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Faça upload de documentos para que o assistente tenha acesso a informações específicas
            </p>
            <Button 
              onClick={addKnowledgeFile}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-12 px-8 rounded-xl shadow-lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              Fazer Primeiro Upload
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {knowledgeFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-gradient-to-r from-slate-50/50 to-emerald-50/30 hover:shadow-md transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-base">{file.name}</p>
                    <p className="text-sm text-slate-500">{file.type.toUpperCase()} • {file.size}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl hover:bg-emerald-100">
                    <Download className="w-4 h-4 text-emerald-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeKnowledgeFile(index)} className="h-10 w-10 rounded-xl hover:bg-red-100">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 