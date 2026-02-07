import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { DEFAULT_PROJECT_CONFIG, ProjectConfig } from "@/types";
import {
  Compass,
  FolderKanban,
  Layers,
  LogOut,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";

type SceneConfig = ProjectConfig & { ownerId?: string };

interface SceneRow {
  id: string;
  config: SceneConfig;
  isPublic: boolean;
  ownerId: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

const LOCAL_ID_KEY = "obs_web_studio_last_id";

const isAccessColumnError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const message = String((error as { message?: string }).message ?? "");
  return message.includes("is_public") || message.includes("user_id");
};

const normalizeConfig = (raw: unknown): SceneConfig => {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_PROJECT_CONFIG };
  }

  const parsed = raw as Partial<SceneConfig>;
  return {
    ...DEFAULT_PROJECT_CONFIG,
    ...parsed,
    layers: Array.isArray(parsed.layers) ? parsed.layers : [],
  };
};

const formatDate = (value?: string | null) => {
  if (!value) return "Bilinmiyor";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Bilinmiyor";
  return date.toLocaleString("tr-TR");
};

export default function Projects() {
  const [, setLocation] = useLocation();
  const { user, isLoading: isAuthLoading, signOut } = useAuth();
  const [projects, setProjects] = useState<SceneRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [localProjectId, setLocalProjectId] = useState<string | null>(null);
  const userEmail = user?.email ?? "Google account";

  useEffect(() => {
    setLocalProjectId(localStorage.getItem(LOCAL_ID_KEY));

    // Clean up URL parameters
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.has("id") || currentUrl.searchParams.has("new")) {
      currentUrl.searchParams.delete("id");
      currentUrl.searchParams.delete("new");
      window.history.replaceState({}, "", currentUrl.toString());
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      setLocation("/login");
    }
  }, [isAuthLoading, setLocation, user]);

  const loadProjects = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      let rowsSource: any[] = [];

      const withAccess = await supabase
        .from("scenes")
        .select("id, config, is_public, user_id, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(100);

      if (withAccess.error) {
        if (!isAccessColumnError(withAccess.error)) {
          throw withAccess.error;
        }

        const legacy = await supabase
          .from("scenes")
          .select("id, config, created_at, updated_at")
          .order("updated_at", { ascending: false })
          .limit(100);

        if (legacy.error) {
          throw legacy.error;
        }

        rowsSource = legacy.data ?? [];
      } else {
        rowsSource = withAccess.data ?? [];
      }

      const rows: SceneRow[] = rowsSource.map((row) => {
        const config = normalizeConfig(row.config);
        const ownerId =
          typeof row.user_id === "string"
            ? row.user_id
            : typeof config.ownerId === "string"
              ? config.ownerId
              : null;
        const isPublic =
          typeof row.is_public === "boolean" ? row.is_public : Boolean(config.isPublic);

        return {
          id: String(row.id),
          config: { ...config, isPublic },
          isPublic,
          ownerId,
          created_at: row.created_at ?? null,
          updated_at: row.updated_at ?? null,
        };
      });

      setProjects(rows);
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Projeler yuklenemedi");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadProjects();
  }, [loadProjects, user]);

  const myProjects = useMemo(() => {
    if (!user) return [];
    return projects.filter((project) => {
      if (project.ownerId) {
        return project.ownerId === user.id;
      }
      return project.id === localProjectId;
    });
  }, [localProjectId, projects, user]);

  const myProjectIds = useMemo(() => new Set(myProjects.map((project) => project.id)), [myProjects]);

  const exploreProjects = useMemo(
    () => projects.filter((project) => project.isPublic && !myProjectIds.has(project.id)),
    [myProjectIds, projects]
  );

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      setLocation("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Cikis yapilamadi");
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isAuthLoading || (!user && !isAuthLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <header className="h-16 border-b border-primary/30 bg-card/80 backdrop-blur-sm">
        <div className="h-full px-4 md:px-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Layers className="w-5 h-5" />
              <span className="font-display tracking-wider text-sm md:text-base">OBS WEB STUDIO</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{userEmail}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/config?new=true">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Settings className="w-4 h-4 mr-2" />
                Yeni Proje
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadProjects()}
              disabled={isLoading}
              className="border-primary/30 hover:border-primary"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="border-primary/30 hover:border-primary"
            >
              {isSigningOut ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6">
        <Tabs defaultValue="mine" className="gap-4">
          <TabsList className="w-full md:w-auto bg-secondary/60">
            <TabsTrigger value="mine" className="flex-1 md:flex-none">
              <FolderKanban className="w-4 h-4 mr-1" />
              Kendi Projelerim ({myProjects.length})
            </TabsTrigger>
            <TabsTrigger value="explore" className="flex-1 md:flex-none">
              <Compass className="w-4 h-4 mr-1" />
              Kesfet ({exploreProjects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mine">
            {myProjects.length === 0 ? (
              <Card className="cyber-panel bg-card/40 border-primary/20">
                <CardContent className="py-10 text-center text-muted-foreground">
                  <FolderKanban className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  Henuz size ait proje bulunamadi.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {myProjects.map((project) => (
                  <Card key={project.id} className="cyber-panel bg-card/50 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-base font-display truncate">{project.config.name}</CardTitle>
                      <CardDescription>ID: {project.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Katman</span>
                        <span className="text-primary">{project.config.layers.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Guncelleme</span>
                        <span>{formatDate(project.updated_at)}</span>
                      </div>
                      <Link href={`/config?id=${project.id}`}>
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                          <Settings className="w-4 h-4 mr-2" />
                          Config'te Ac
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="explore">
            {exploreProjects.length === 0 ? (
              <Card className="cyber-panel bg-card/40 border-primary/20">
                <CardContent className="py-10 text-center text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  Kesfet sekmesinde gosterilecek public proje yok.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {exploreProjects.map((project) => (
                  <Card key={project.id} className="cyber-panel bg-card/50 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-base font-display truncate">{project.config.name}</CardTitle>
                      <CardDescription>ID: {project.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Katman</span>
                        <span className="text-primary">{project.config.layers.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Guncelleme</span>
                        <span>{formatDate(project.updated_at)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/config?id=${project.id}`} className="flex-1">
                          <Button variant="outline" className="w-full border-primary/30 hover:border-primary hover:bg-primary/10">
                            <Settings className="w-4 h-4 mr-2" />
                            Config'te Ac
                          </Button>
                        </Link>
                        <Link href={`/?id=${project.id}`} className="flex-1">
                          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                            <Compass className="w-4 h-4 mr-2" />
                            Yayinda Gor
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

