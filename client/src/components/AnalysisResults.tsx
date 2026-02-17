import { AggregateResponse } from "@shared/schema";
import { ScoreCircle } from "./ui/score-circle";
import { Card } from "./ui/card";
import { motion } from "framer-motion";
import { Check, X, Minus, Trophy, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  data: AggregateResponse;
}

const engineColors: Record<string, string> = {
  chatgpt: "#10a37f",
  gemini: "#4285f4",
  claude: "#d97757",
  deepseek: "#6366f1",
};

const EngineCard = ({ name, presence, position }: { name: string, presence: number, position: number | null }) => {
  const isFound = presence > 0;
  const isTop = presence === 2;
  
  return (
    <Card className="p-4 flex items-center justify-between hover:shadow-md transition-shadow duration-300 border-l-4" style={{ borderLeftColor: engineColors[name] || '#ccc' }}>
      <div className="flex items-center gap-3">
        <div className="capitalize font-semibold text-lg">{name}</div>
      </div>
      <div className="flex flex-col items-end">
        <div className={`flex items-center gap-1.5 font-medium ${isFound ? 'text-green-600' : 'text-red-500'}`}>
          {isFound ? (
            <>
              <Check className="w-4 h-4" />
              <span>Found</span>
            </>
          ) : (
            <>
              <X className="w-4 h-4" />
              <span>Not Found</span>
            </>
          )}
        </div>
        {position && (
          <div className="text-xs text-muted-foreground">
            Rank #{position}
          </div>
        )}
      </div>
    </Card>
  );
};

export function AnalysisResults({ data }: Props) {
  // Transform leaderboard for chart
  const chartData = data.leaderboard.slice(0, 5).map(item => ({
    name: item.name,
    mentions: item.freq,
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-12"
    >
      {/* Header Summary */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
          <Search className="w-3 h-3" />
          <span>Analysis for "{data.brand}" in "{data.query}"</span>
        </div>
        <h2 className="text-3xl font-serif text-primary">Analysis Complete</h2>
      </div>

      {/* Main Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        <ScoreCircle 
          score={data.presenceScore} 
          label="Presence Score" 
          subLabel="Visibility across engines"
          size="lg"
          color="hsl(var(--primary))"
        />
        <ScoreCircle 
          score={data.rankingScore} 
          label="Rank Score" 
          subLabel="Position weighted average"
          size="lg"
          color="hsl(var(--accent))"
        />
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Engine Breakdown */}
        <div className="space-y-4">
          <h3 className="text-xl font-serif font-semibold mb-4 border-b pb-2">Engine Breakdown</h3>
          <div className="grid gap-3">
            {Object.entries(data.perEngine.presenceByEngine).map(([engine, presence]) => (
              <EngineCard 
                key={engine} 
                name={engine} 
                presence={presence} 
                position={data.perEngine.posByEngine[engine]} 
              />
            ))}
          </div>
        </div>

        {/* Right: Leaderboard */}
        <div className="space-y-4">
          <h3 className="text-xl font-serif font-semibold mb-4 border-b pb-2">Market Leaders</h3>
          <Card className="p-6">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} interval={0} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="mentions" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === data.brand ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              {data.leaderboard.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm py-1 border-b last:border-0 border-dashed">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {idx + 1}
                    </span>
                    <span className={item.name === data.brand ? "font-bold text-primary" : ""}>{item.name}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">{item.freq} mentions</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
