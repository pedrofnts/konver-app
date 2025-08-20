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
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${
          searchFocused ? 'text-primary konver-animate-glow-pulse' : 'text-muted-foreground'
        }`} />
        <Input
          placeholder="Buscar arquivos por nome..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => onSearchFocus(true)}
          onBlur={() => onSearchFocus(false)}
          className="pl-10 konver-input-focus"
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

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Status Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0">
          {statusOptions.map((status) => (
            <button
              key={status.key}
              onClick={() => onStatusFilterChange(status.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                statusFilter === status.key
                  ? 'konver-gradient-primary text-white shadow-lg konver-animate-bounce'
                  : 'bg-muted/50 text-muted-foreground konver-hover-subtle'
              }`}
            >
{status.key === 'all' ? 'Todos' : 
               status.key === 'ready' ? 'Prontos' :
               status.key === 'processing' ? 'Processando' : 'Erros'} ({status.count})
            </button>
          ))}
        </div>

        {/* Type Filter */}
        {availableTypes.length > 0 && (
          <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => onTypeFilterChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                typeFilter === 'all'
                  ? 'konver-gradient-accent text-white shadow-lg'
                  : 'bg-muted/50 text-muted-foreground konver-hover-subtle'
              }`}
            >
              Todos os Tipos
            </button>
            {availableTypes.map((type) => (
              <button
                key={type}
                onClick={() => onTypeFilterChange(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  typeFilter === type
                    ? 'konver-gradient-accent text-white shadow-lg'
                    : 'bg-muted/50 text-muted-foreground konver-hover-subtle'
                }`}
              >
                .{type.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Sort Controls */}
        <div className="flex items-center space-x-2 ml-auto">
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <span>Ordenar:</span>
            <select
              value={sortField}
              onChange={(e) => onSortChange(e.target.value as SortField)}
              className="bg-transparent border-none text-xs focus:outline-none cursor-pointer"
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSortChange(sortField)}
            className="h-8 w-8 p-0"
          >
            {sortDirection === 'asc' ? (
              <SortAsc className="w-4 h-4" />
            ) : (
              <SortDesc className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Filter Results Summary */}
      {(hasActiveFilters || filteredCount !== totalCount) && (
        <div className="flex items-center justify-between py-2 text-sm">
          <div className="text-muted-foreground">
            {searchTerm && `Busca: "${searchTerm}" • `}
            {statusFilter !== 'all' && `Status: ${statusFilter} • `}
            {typeFilter !== 'all' && `Tipo: ${typeFilter} • `}
            Mostrando {filteredCount} de {totalCount} arquivos
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-primary konver-hover-subtle h-8"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>
      )}

      {/* Active Filters Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <Badge variant="secondary" className="text-xs">
              Busca: {searchTerm}
              <button
                onClick={() => onSearchChange('')}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Status: {statusFilter}
              <button
                onClick={() => onStatusFilterChange('all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {typeFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Tipo: {typeFilter}
              <button
                onClick={() => onTypeFilterChange('all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
