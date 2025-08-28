import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  X,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react";
import { KnowledgeFileStats } from "@/hooks/useKnowledgeBase";

export type SortField = 'file_name' | 'file_size' | 'created_at' | 'status';
export type SortDirection = 'asc' | 'desc';

interface KnowledgeBaseFiltersProps {
  // Search and filters
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  
  // Sorting
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
  
  // Data
  stats: KnowledgeFileStats;
  filteredCount: number;
  totalCount: number;
  availableTypes?: string[];
  
  // State
  searchFocused: boolean;
  onSearchFocus: (focused: boolean) => void;
}

export default function KnowledgeBaseFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  sortField,
  sortDirection,
  onSortChange,
  stats,
  filteredCount,
  totalCount,
  availableTypes = [],
  searchFocused,
  onSearchFocus
}: KnowledgeBaseFiltersProps) {

  const clearFilters = () => {
    onSearchChange('');
    onStatusFilterChange('all');
    onTypeFilterChange('all');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || typeFilter !== 'all';

  const statusOptions = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'ready', label: 'Ready', count: stats.ready },
    { key: 'processing', label: 'Processing', count: stats.processing },
    { key: 'error', label: 'Error', count: stats.error }
  ];

  const sortOptions = [
    { key: 'created_at', label: 'Data de Criação' },
    { key: 'file_name', label: 'Nome' },
    { key: 'file_size', label: 'Tamanho' },
    { key: 'status', label: 'Status' }
  ];

  return (
    <div className="konver-glass-card rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Filtros e Busca</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Limpar Tudo
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${
          searchFocused ? 'text-primary' : 'text-muted-foreground'
        }`} />
        <Input
          placeholder="Buscar arquivos por nome..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => onSearchFocus(true)}
          onBlur={() => onSearchFocus(false)}
          className="pl-10"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Status Filter */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground font-medium">Status:</span>
          <div className="flex space-x-1">
            {statusOptions.map((status) => (
              <button
                key={status.key}
                onClick={() => onStatusFilterChange(status.key)}
                className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  statusFilter === status.key
                    ? 'konver-gradient-primary text-white shadow-sm'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {status.key === 'all' ? 'Todos' : 
                 status.key === 'ready' ? 'Prontos' :
                 status.key === 'processing' ? 'Processando' : 'Erros'} ({status.count})
              </button>
            ))}
          </div>
        </div>

        {/* Type Filter */}
        {availableTypes.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground font-medium">Tipo:</span>
            <div className="flex space-x-1 flex-wrap">
              <button
                onClick={() => onTypeFilterChange('all')}
                className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  typeFilter === 'all'
                    ? 'konver-gradient-accent text-white shadow-sm'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                Todos
              </button>
              {availableTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => onTypeFilterChange(type)}
                  className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    typeFilter === type
                      ? 'konver-gradient-accent text-white shadow-sm'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  .{type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sort Controls */}
        <div className="space-y-2 lg:ml-auto">
          <span className="text-xs text-muted-foreground font-medium">Ordenar:</span>
          <div className="flex items-center space-x-2">
            <select
              value={sortField}
              onChange={(e) => onSortChange(e.target.value as SortField)}
              className="bg-muted/30 border border-muted/50 rounded-md text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSortChange(sortField)}
              className="h-7 w-7 p-0"
            >
              {sortDirection === 'asc' ? (
                <SortAsc className="w-3 h-3" />
              ) : (
                <SortDesc className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {filteredCount !== totalCount && (
        <div className="pt-2 border-t border-muted/20">
          <p className="text-xs text-muted-foreground">
            Mostrando <span className="font-medium text-foreground">{filteredCount}</span> de <span className="font-medium text-foreground">{totalCount}</span> arquivos
          </p>
        </div>
      )}
    </div>
  );
}
